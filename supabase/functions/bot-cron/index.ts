import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: bots, error: botsError } = await supabase
      .from("bot_settings")
      .select("*")
      .eq("is_active", true);

    if (botsError || !bots || bots.length === 0) {
      return new Response(JSON.stringify({ message: "No active bots found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, string[]> = {};

    for (const bot of bots) {
      results[bot.name] = [];
      const allowedContexts: string[] = bot.allowed_contexts || ["chat", "guestbook"];

      // =============================================
      // PRIORITY 1: Reply to entries in the BOT'S OWN profile guestbook
      // No mention or @ needed — if someone writes on the bot's wall, the bot replies.
      // =============================================
      if (allowedContexts.includes("guestbook")) {
        const didProfileReply = await handleBotProfileGuestbookReplies(supabase, supabaseUrl, bot, results);
        if (didProfileReply) continue;
      }

      // =============================================
      // PRIORITY 2: Reply to unread chat/DM messages
      // =============================================
      if (allowedContexts.includes("chat")) {
        const didChatReply = await handleChatReplies(supabase, supabaseUrl, bot, results);
        if (didChatReply) continue;
      }

      // =============================================
      // PRIORITY 3: Inactive user outreach (max 1 DM per user per month)
      // =============================================
      if (allowedContexts.includes("chat")) {
        const didOutreach = await handleInactiveUserOutreach(supabase, supabaseUrl, bot, results);
        if (didOutreach) continue;
      }

      // =============================================
      // PRIORITY 4: Autonomous guestbook post (activity roll)
      // =============================================
      const roll = Math.random() * 100;
      if (roll > bot.activity_level) {
        results[bot.name].push(`Skipped autonomous (roll ${roll.toFixed(0)} > level ${bot.activity_level})`);
        continue;
      }

      const autonomousContexts = allowedContexts.filter(c => c !== "chat");
      if (autonomousContexts.length === 0) {
        results[bot.name].push("No autonomous contexts left");
        continue;
      }
      const chosenContext = autonomousContexts[Math.floor(Math.random() * autonomousContexts.length)];

      if (chosenContext === "guestbook") {
        try {
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { data: recentBotPosts } = await supabase
            .from("guestbook_entries")
            .select("id")
            .eq("user_id", bot.user_id)
            .gte("created_at", oneHourAgo)
            .limit(1);

          if (recentBotPosts && recentBotPosts.length > 0) {
            results[bot.name].push("Guestbook skipped: already posted within the last hour");
            continue;
          }

          const { data: recentEntries } = await supabase
            .from("guestbook_entries")
            .select("author_name, message")
            .order("created_at", { ascending: false })
            .limit(10);

          const othersEntries = recentEntries?.filter(e => e.author_name !== bot.name) || [];
          const contextStr = othersEntries.length > 0
            ? `\n\nSenaste inläggen i gästboken från andra användare:\n${othersEntries.map(e => `- ${e.author_name}: "${e.message}"`).join("\n")}`
            : "";

          const res = await callBotRespond(supabaseUrl, {
            action: "guestbook_post",
            bot_id: bot.id,
            context: contextStr,
          });
          results[bot.name].push(`Guestbook: ${res.reply || res.error || "unknown"}`);
        } catch (e) {
          results[bot.name].push(`Guestbook error: ${(e as Error).message}`);
        }
      } else if (chosenContext === "news") {
        const { data: latestNews } = await supabase
          .from("news_articles")
          .select("id, title, content")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (latestNews && latestNews.length > 0) {
          const article = latestNews[Math.floor(Math.random() * latestNews.length)];
          try {
            const res = await callBotRespond(supabaseUrl, {
              action: "guestbook_post",
              bot_id: bot.id,
              context: `Kommentera den senaste nyheten "${article.title}". Referera till innehållet: "${article.content.substring(0, 200)}"`,
            });
            results[bot.name].push(`News comment about "${article.title}": ${res.reply || res.error || "unknown"}`);
          } catch (e) {
            results[bot.name].push(`News error: ${(e as Error).message}`);
          }
        } else {
          results[bot.name].push("No news to comment on");
        }
      }
    }

    console.log("Bot cron results:", JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-cron error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Reply to entries posted on the BOT'S OWN profile guestbook.
 * No @ or # needed — any entry on the bot's profile triggers a reply.
 */
async function handleBotProfileGuestbookReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Only look at entries on THIS BOT'S profile, from other users
    const { data: recentEntries } = await supabase
      .from("profile_guestbook")
      .select("id, author_name, author_id, message, profile_owner_id, created_at")
      .eq("profile_owner_id", bot.user_id)
      .neq("author_id", bot.user_id)
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentEntries || recentEntries.length === 0) return false;

    const targetEntry = recentEntries[0];

    // Check if bot already replied after this entry
    const { data: botRepliesAfter } = await supabase
      .from("profile_guestbook")
      .select("id")
      .eq("author_id", bot.user_id)
      .eq("profile_owner_id", bot.user_id)
      .gte("created_at", targetEntry.created_at)
      .limit(1);

    if (botRepliesAfter && botRepliesAfter.length > 0) return false;

    // Rate limit: max 1 reply per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentBotPosts } = await supabase
      .from("profile_guestbook")
      .select("id")
      .eq("author_id", bot.user_id)
      .gte("created_at", tenMinAgo)
      .limit(1);

    if (recentBotPosts && recentBotPosts.length > 0) {
      results[bot.name as string].push("Profile guestbook reply skipped: rate limited (10 min cooldown)");
      return false;
    }

    // Determine reply type naturally: is it a question or a greeting?
    const isQuestion = targetEntry.message.includes("?");
    const replyType = isQuestion ? "question" : "greeting";

    const conversationContext = recentEntries
      .slice(0, 10)
      .reverse()
      .map(e => `- ${e.author_name}: "${e.message}"`)
      .join("\n");

    // Reply in the AUTHOR's profile guestbook (not the bot's own)
    const res = await callBotRespond(supabaseUrl, {
      action: "profile_guestbook_reply",
      bot_id: bot.id,
      context: conversationContext,
      target_username: targetEntry.author_name,
      target_id: targetEntry.author_id,
      profile_owner_id: targetEntry.author_id,
      reply_type: replyType,
    });

    results[bot.name as string].push(
      `Profile guestbook ${replyType} reply to ${targetEntry.author_name}: ${res.reply || res.error || "unknown"}`
    );
    return true;
  } catch (e) {
    results[bot.name as string].push(`Profile guestbook reply error: ${(e as Error).message}`);
    return false;
  }
}

/**
 * Reply to unread DMs/chat messages sent to the bot.
 */
async function handleChatReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    const { data: recentMsgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("recipient_id", bot.user_id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentMsgs || recentMsgs.length === 0) return false;

    // Filter out messages from the bot itself (prevent self-chat)
    const senderIds = [...new Set(recentMsgs.map(m => m.sender_id))].filter(id => id !== bot.user_id);
    if (senderIds.length === 0) return false;
    const chosenSenderId = senderIds[Math.floor(Math.random() * senderIds.length)];
    const senderMessages = recentMsgs.filter(m => m.sender_id === chosenSenderId);

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", chosenSenderId)
      .single();

    const senderName = senderProfile?.username || "en användare";

    const messagesContext = senderMessages
      .slice(0, 5)
      .reverse()
      .map(m => `"${m.content}"`)
      .join(", ");

    const contextStr = `Du chattar med ${senderName}. Deras senaste meddelanden: ${messagesContext}. Svara ${senderName} direkt.`;
    const res = await callBotRespond(supabaseUrl, {
      action: "chat_reply",
      bot_id: bot.id,
      context: contextStr,
      target_id: chosenSenderId,
      target_username: senderName,
    });

    for (const m of senderMessages) {
      await supabase.from("chat_messages").update({ is_read: true }).eq("id", m.id);
    }

    results[bot.name as string].push(`Chat reply to ${senderName}: ${res.reply || res.error || "unknown"}`);
    return true;
  } catch (e) {
    results[bot.name as string].push(`Chat error: ${(e as Error).message}`);
    return false;
  }
}

/**
 * Send a friendly DM to users who have been inactive for 2+ weeks.
 * Max 1 outreach message per user per month.
 */
async function handleInactiveUserOutreach(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    // Only attempt outreach 10% of the time to avoid spamming
    if (Math.random() > 0.1) return false;

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Find users who are friends with the bot but haven't been seen in 2+ weeks
    const { data: botFriends } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", bot.user_id)
      .eq("status", "accepted");

    if (!botFriends || botFriends.length === 0) return false;

    const friendIds = botFriends.map(f => f.friend_id);

    // Find inactive friends (last_seen > 2 weeks ago)
    const { data: inactiveProfiles } = await supabase
      .from("profiles")
      .select("user_id, username, last_seen")
      .in("user_id", friendIds)
      .lt("last_seen", twoWeeksAgo)
      .limit(5);

    if (!inactiveProfiles || inactiveProfiles.length === 0) return false;

    // For each candidate, check if bot already sent a message in the last month
    for (const profile of inactiveProfiles) {
      const { data: recentOutreach } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("sender_id", bot.user_id)
        .eq("recipient_id", profile.user_id)
        .gte("created_at", oneMonthAgo)
        .limit(1);

      if (recentOutreach && recentOutreach.length > 0) continue; // Already messaged this month

      // Send outreach
      const res = await callBotRespond(supabaseUrl, {
        action: "inactive_outreach",
        bot_id: bot.id,
        target_id: profile.user_id,
        target_username: profile.username,
        context: `${profile.username} har inte varit online på över två veckor. Senast sedd: ${profile.last_seen}.`,
      });

      results[bot.name as string].push(
        `Inactive outreach to ${profile.username}: ${res.reply || res.error || "unknown"}`
      );
      return true; // Only one outreach per cron run
    }

    return false;
  } catch (e) {
    results[bot.name as string].push(`Outreach error: ${(e as Error).message}`);
    return false;
  }
}

async function callBotRespond(
  supabaseUrl: string,
  body: Record<string, unknown>
) {
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  const res = await fetch(`${supabaseUrl}/functions/v1/bot-respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });

  return await res.json();
}
