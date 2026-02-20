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

    // Fetch all active bots with their automation settings
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
      // PRIORITY 1: Reply to guestbook entries that mention the bot or contain questions
      // These ALWAYS trigger, bypassing activity roll
      // =============================================
      if (allowedContexts.includes("guestbook")) {
        const didReply = await handleReactiveGuestbookReplies(supabase, supabaseUrl, bot, results);
        if (didReply) {
          // Prioritize replies — skip autonomous posting this cycle
          continue;
        }
      }

      // =============================================
      // PRIORITY 2: Reply to unread chat messages (always triggers if present)
      // =============================================
      if (allowedContexts.includes("chat")) {
        const { data: recentMsgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("recipient_id", bot.user_id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMsgs && recentMsgs.length > 0) {
          const senderIds = [...new Set(recentMsgs.map(m => m.sender_id))];
          const chosenSenderId = senderIds[Math.floor(Math.random() * senderIds.length)];
          const senderMessages = recentMsgs.filter(m => m.sender_id === chosenSenderId);

          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", chosenSenderId)
            .single();

          const senderName = senderProfile?.username || "en användare";

          try {
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
              await supabase
                .from("chat_messages")
                .update({ is_read: true })
                .eq("id", m.id);
            }
            results[bot.name].push(`Chat reply to ${senderName}: ${res.reply || res.error || "unknown"}`);
          } catch (e) {
            results[bot.name].push(`Chat error: ${e.message}`);
          }
          // Prioritize human replies — skip autonomous posts
          continue;
        }
      }

      // =============================================
      // PRIORITY 3: Autonomous posting (activity roll applies)
      // =============================================
      const roll = Math.random() * 100;
      if (roll > bot.activity_level) {
        results[bot.name].push(`Skipped (roll ${roll.toFixed(0)} > level ${bot.activity_level})`);
        continue;
      }

      if (allowedContexts.length === 0) {
        results[bot.name].push("No allowed contexts configured");
        continue;
      }

      // Pick a random allowed action for autonomous posting
      const autonomousContexts = allowedContexts.filter(c => c !== "chat"); // chat handled above
      if (autonomousContexts.length === 0) {
        results[bot.name].push("No autonomous contexts left");
        continue;
      }
      const chosenContext = autonomousContexts[Math.floor(Math.random() * autonomousContexts.length)];

      if (chosenContext === "guestbook") {
        try {
          // Rate limit: max 1 guestbook post per hour per bot
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
          results[bot.name].push(`Guestbook error: ${e.message}`);
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
            results[bot.name].push(`News error: ${e.message}`);
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
 * REACTIVE REPLIES: Check if anyone mentioned the bot or asked a question in the guestbook.
 * Returns true if a reply was posted (so we skip autonomous actions).
 */
async function handleReactiveGuestbookReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    // Look at recent guestbook entries (last 30 min) from OTHER users
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentEntries } = await supabase
      .from("guestbook_entries")
      .select("id, author_name, message, user_id, created_at")
      .neq("user_id", bot.user_id)
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!recentEntries || recentEntries.length === 0) return false;

    const botName = (bot.name as string).toLowerCase();

    // Find entries that mention the bot OR contain a question
    const mentionEntries = recentEntries.filter(e =>
      e.message.toLowerCase().includes(botName)
    );
    const questionEntries = recentEntries.filter(e =>
      !e.message.toLowerCase().includes(botName) && e.message.includes("?")
    );

    // Prioritize mentions over questions
    const targetEntry = mentionEntries[0] || questionEntries[0];
    if (!targetEntry) return false;

    // Check if bot already replied to this entry (look for bot posts after target entry)
    const { data: botRepliesAfter } = await supabase
      .from("guestbook_entries")
      .select("id")
      .eq("user_id", bot.user_id)
      .gte("created_at", targetEntry.created_at)
      .limit(1);

    if (botRepliesAfter && botRepliesAfter.length > 0) {
      return false; // Already replied
    }

    // Rate limit: max 1 reply per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentBotPosts } = await supabase
      .from("guestbook_entries")
      .select("id")
      .eq("user_id", bot.user_id)
      .gte("created_at", tenMinAgo)
      .limit(1);

    if (recentBotPosts && recentBotPosts.length > 0) {
      results[bot.name as string].push("Reactive reply skipped: rate limited (10 min cooldown)");
      return false;
    }

    const isMention = mentionEntries.length > 0;
    const replyType = isMention ? "mention" : "question";

    // Build context with surrounding messages for better replies
    const surroundingContext = recentEntries
      .slice(0, 10)
      .reverse()
      .map(e => `- ${e.author_name}: "${e.message}"`)
      .join("\n");

    const res = await callBotRespond(supabaseUrl, {
      action: "guestbook_reply",
      bot_id: bot.id,
      context: surroundingContext,
      target_username: targetEntry.author_name,
      reply_type: replyType,
    });

    results[bot.name as string].push(
      `Reactive ${replyType} reply to ${targetEntry.author_name}: ${res.reply || res.error || "unknown"}`
    );
    return true;
  } catch (e) {
    results[bot.name as string].push(`Reactive reply error: ${(e as Error).message}`);
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
