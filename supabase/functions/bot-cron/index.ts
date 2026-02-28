import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dygnsrytm: reduce activity at night (Swedish time approx UTC+1)
function getDygnsrytmMultiplier(): number {
  const hour = new Date().getUTCHours() + 1;
  if (hour >= 2 && hour <= 7) return 0.05; // Almost zero at night
  if (hour >= 18 && hour <= 23) return 1.5; // Peak evening
  if (hour >= 8 && hour <= 11) return 0.6; // Morning slow
  return 1.0; // Normal
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const isServiceRole = authHeader === `Bearer ${serviceRoleKey}`;
  const isScheduler = req.headers.get("x-supabase-scheduler") !== null;

  // Also allow authenticated admin users
  let isAdmin = false;
  if (!isServiceRole && !isScheduler && authHeader.startsWith("Bearer ")) {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (user) {
      const { data: hasAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
      isAdmin = hasAdmin === true;
    }
  }

  if (!isServiceRole && !isScheduler && !isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
    const dygnsMultiplier = getDygnsrytmMultiplier();

    // =============================================
    // NEW: Welcome new users (check for recently created profiles)
    // =============================================
    await handleNewUserWelcome(supabase, supabaseUrl, bots, results);

    // =============================================
    // NEW: Inter-bot banter (occasional fun debates)
    // =============================================
    if (bots.length >= 2 && Math.random() < 0.08 * dygnsMultiplier) {
      await handleBotBanter(supabase, supabaseUrl, bots, results);
    }

    // =============================================
    // Lajv posts: occasional spontaneous status updates
    // =============================================
    await handleLajvPosts(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    // =============================================
    // Profile guestbook writing: bots visit and write in others' guestbooks
    // =============================================
    await handleProfileGuestbookWriting(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    for (const bot of bots) {
      results[bot.name] = results[bot.name] || [];
      const allowedContexts: string[] = bot.allowed_contexts || ["chat", "guestbook"];

      // PRIORITY 1: Reply to entries in the BOT'S OWN profile guestbook
      if (allowedContexts.includes("guestbook")) {
        const didProfileReply = await handleBotProfileGuestbookReplies(supabase, supabaseUrl, bot, results);
        if (didProfileReply) continue;
      }

      // PRIORITY 2: Reply to unread chat/DM messages (with typing delay)
      if (allowedContexts.includes("chat")) {
        const didChatReply = await handleChatReplies(supabase, supabaseUrl, bot, results);
        if (didChatReply) continue;
      }

      // PRIORITY 3: Inactive user outreach
      if (allowedContexts.includes("chat")) {
        const didOutreach = await handleInactiveUserOutreach(supabase, supabaseUrl, bot, results);
        if (didOutreach) continue;
      }

      // PRIORITY 4: Autonomous guestbook post (activity roll × dygnsrytm)
      const adjustedLevel = bot.activity_level * dygnsMultiplier;
      const roll = Math.random() * 100;
      if (roll > adjustedLevel) {
        results[bot.name].push(`Skipped autonomous (roll ${roll.toFixed(0)} > adjusted ${adjustedLevel.toFixed(0)})`);
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

    // Update bot presence (last_seen) for all active bots
    try {
      await fetch(`${supabaseUrl}/functions/v1/bot-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ action: "update_presence" }),
      });
    } catch (e) {
      console.error("Bot presence update error:", e);
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

// =============================================
// NEW: Welcome new users within the last 30 minutes
// =============================================
async function handleNewUserWelcome(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // Find recently created profiles (new users)
    const { data: newUsers } = await supabase
      .from("profiles")
      .select("user_id, username")
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!newUsers || newUsers.length === 0) return;

    // Get bot user_ids to filter them out
    const botUserIds = new Set(bots.map(b => b.user_id as string));

    for (const newUser of newUsers) {
      // Skip if new user is a bot
      if (botUserIds.has(newUser.user_id)) continue;

      // Check if any bot already welcomed this user
      const { data: existingWelcome } = await supabase
        .from("chat_messages")
        .select("id")
        .in("sender_id", Array.from(botUserIds))
        .eq("recipient_id", newUser.user_id)
        .limit(1);

      if (existingWelcome && existingWelcome.length > 0) continue;

      // Pick a random bot to welcome them
      const welcomeBot = bots[Math.floor(Math.random() * bots.length)];
      const botName = welcomeBot.name as string;
      results[botName] = results[botName] || [];

      // Broadcast typing indicator before responding
      await broadcastTypingIndicator(supabase, welcomeBot.user_id as string, newUser.user_id);

      const res = await callBotRespond(supabaseUrl, {
        action: "welcome_new_user",
        bot_id: welcomeBot.id,
        target_id: newUser.user_id,
        target_username: newUser.username,
      });

      results[botName].push(`Welcome to ${newUser.username}: ${res.reply || res.error || "unknown"}`);

      // Auto-friend request from bot to new user
      await supabase.from("friends").insert({
        user_id: welcomeBot.user_id as string,
        friend_id: newUser.user_id,
        status: "accepted",
        category: "Nätvän",
      }).then(() => {});
    }
  } catch (e) {
    console.error("New user welcome error:", e);
  }
}

// =============================================
// NEW: Inter-bot banter (fun debates)
// =============================================
const BANTER_TOPICS = [
  "vilket godis var bäst 2004? polly eller ahlgrens bilar? kexchoklad räknas inte",
  "MSN eller ICQ — vad var egentligen bäst? msn hade winks iaf",
  "vem minns när man brände CD-skivor med nero? bästa låtlistan nånsin",
  "nokia 3310 eller sony ericsson t610? fight me lol",
  "habbo hotel vs runescape — var spenderade ni mest tid?",
  "limewire eller kazaa? virus-rouletten haha",
  "var the OC bättre än one tree hill? seth cohen > alla",
  "bästa MSN-nicket ni haft? mitt var cringe asså",
  "vem hade INTE en blogg på blogg.se typ 2005?",
  "linkin park eller evanescence? den eviga frågan tbh",
  "petter - mikrofonkåt eller timbuktu - alla vill till himmelen? discuss",
  "basshunter - boten anna.. klassiker eller cringe? XD",
  "kent vs håkan hellström? omöjligt val typ",
  "pistvakt eller vita lögner? bästa svenska serien??",
  "expedition robinson eller idol? vad va viktigast att kolla på",
  "jolt cola eller mountain dew? den riktiga gamer-drycken",
  "CS 1.6 dust2 eller de_nuke? alla vet svaret ba",
  "vem mer ladda ner låtar från napster och brände på CD?? nostalgi",
  "blogg.se eller bilddagboken? var hade man flest kommentarer",
  "snake på nokia eller ormen i J2ME? det riktiga mobilspelet",
];

async function handleBotBanter(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    // Check cooldown: no banter in last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const botUserIds = bots.map(b => b.user_id as string);

    // Pick 2 random different bots
    const shuffled = [...bots].sort(() => Math.random() - 0.5);
    const bot1 = shuffled[0];
    const bot2 = shuffled[1];
    if (!bot1 || !bot2) return;

    const topic = BANTER_TOPICS[Math.floor(Math.random() * BANTER_TOPICS.length)];

    // Bot 1 starts the debate
    const res1 = await callBotRespond(supabaseUrl, {
      action: "bot_banter",
      bot_id: bot1.id,
      context: `Starta en rolig debatt om: ${topic}. Du ska ta EN sida starkt.`,
    });

    results[bot1.name as string] = results[bot1.name as string] || [];
    results[bot1.name as string].push(`Banter started: ${res1.reply || "unknown"}`);

    // Small delay then bot 2 responds
    await new Promise(r => setTimeout(r, 3000));

    const res2 = await callBotRespond(supabaseUrl, {
      action: "bot_banter",
      bot_id: bot2.id,
      context: `Svara på denna åsikt om "${topic}": "${res1.reply}". Ta MOTSATT sida! Var roligt oenig.`,
    });

    results[bot2.name as string] = results[bot2.name as string] || [];
    results[bot2.name as string].push(`Banter reply: ${res2.reply || "unknown"}`);
  } catch (e) {
    console.error("Bot banter error:", e);
  }
}

// =============================================
// Typing indicator broadcast (Realtime)
// =============================================
async function broadcastTypingIndicator(
  supabase: ReturnType<typeof createClient>,
  botUserId: string,
  targetUserId: string
) {
  try {
    // Broadcast typing event on the chat channel
    const channelName = `chat-typing-${[botUserId, targetUserId].sort().join('-')}`;
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: botUserId, typing: true },
    });

    // Wait 5-10 seconds (simulated typing)
    const delay = 5000 + Math.random() * 5000;
    await new Promise(r => setTimeout(r, delay));

    // Stop typing
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: botUserId, typing: false },
    });
  } catch (e) {
    // Non-critical, just log
    console.error("Typing indicator error:", e);
  }
}

/**
 * Reply to entries posted on the BOT'S OWN profile guestbook.
 */
async function handleBotProfileGuestbookReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentEntries } = await supabase
      .from("profile_guestbook")
      .select("id, author_name, author_id, message, profile_owner_id, created_at")
      .eq("profile_owner_id", bot.user_id)
      .neq("author_id", bot.user_id)
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    const filteredEntries = recentEntries?.filter(e => e.author_id !== e.profile_owner_id) || [];
    if (filteredEntries.length === 0) return false;

    const targetEntry = filteredEntries[0];

    const { data: botRepliesAfter } = await supabase
      .from("profile_guestbook")
      .select("id")
      .eq("author_id", bot.user_id)
      .eq("profile_owner_id", targetEntry.author_id)
      .gte("created_at", targetEntry.created_at)
      .limit(1);

    if (botRepliesAfter && botRepliesAfter.length > 0) return false;

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

    const isQuestion = targetEntry.message.includes("?");
    const replyType = isQuestion ? "question" : "greeting";

    const conversationContext = filteredEntries
      .slice(0, 10)
      .reverse()
      .map(e => `- ${e.author_name}: "${e.message}"`)
      .join("\n");

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
 * Reply to unread DMs/chat messages sent to the bot (with typing indicator).
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

    // Broadcast typing indicator before responding
    await broadcastTypingIndicator(supabase, bot.user_id as string, chosenSenderId);

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
 */
async function handleInactiveUserOutreach(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bot: Record<string, unknown>,
  results: Record<string, string[]>
): Promise<boolean> {
  try {
    if (Math.random() > 0.1) return false;

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: botFriends } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", bot.user_id)
      .eq("status", "accepted");

    if (!botFriends || botFriends.length === 0) return false;

    const friendIds = botFriends.map(f => f.friend_id);

    const { data: inactiveProfiles } = await supabase
      .from("profiles")
      .select("user_id, username, last_seen")
      .in("user_id", friendIds)
      .lt("last_seen", twoWeeksAgo)
      .limit(5);

    if (!inactiveProfiles || inactiveProfiles.length === 0) return false;

    for (const profile of inactiveProfiles) {
      const { data: recentOutreach } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("sender_id", bot.user_id)
        .eq("recipient_id", profile.user_id)
        .gte("created_at", oneMonthAgo)
        .limit(1);

      if (recentOutreach && recentOutreach.length > 0) continue;

      // Broadcast typing before outreach
      await broadcastTypingIndicator(supabase, bot.user_id as string, profile.user_id);

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
      return true;
    }

    return false;
  } catch (e) {
    results[bot.name as string].push(`Outreach error: ${(e as Error).message}`);
    return false;
  }
}

// =============================================
// Lajv posts: bots post spontaneous status updates
// =============================================
async function handleLajvPosts(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    // Only 1-2 bots post per cron cycle, with dygnsrytm
    const chance = 0.06 * dygnsMultiplier;
    
    for (const bot of bots) {
      if (Math.random() > chance) continue;
      
      const botName = bot.name as string;
      results[botName] = results[botName] || [];

      // Cooldown: no lajv from this bot in last 30 min
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: recentLajv } = await supabase
        .from("lajv_messages")
        .select("id")
        .eq("user_id", bot.user_id)
        .gte("created_at", thirtyMinAgo)
        .limit(1);

      if (recentLajv && recentLajv.length > 0) {
        results[botName].push("Lajv skipped: cooldown");
        continue;
      }

      const res = await callBotRespond(supabaseUrl, {
        action: "lajv_post",
        bot_id: bot.id,
        context: "",
      });

      results[botName].push(`Lajv post: ${res.reply || res.error || "unknown"}`);
      
      // Only one bot posts per cycle to keep it natural
      break;
    }
  } catch (e) {
    console.error("Lajv post error:", e);
  }
}

// =============================================
// Profile guestbook writing: bots write in others' guestbooks
// =============================================
async function handleProfileGuestbookWriting(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    // ~5% chance per cycle × dygnsrytm
    if (Math.random() > 0.05 * dygnsMultiplier) return;

    // Pick a random bot as author
    const authorBot = bots[Math.floor(Math.random() * bots.length)];
    const botName = authorBot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: no profile guestbook write from this bot in last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: recentWrites } = await supabase
      .from("profile_guestbook")
      .select("id")
      .eq("author_id", authorBot.user_id)
      .gte("created_at", twoHoursAgo)
      .limit(1);

    if (recentWrites && recentWrites.length > 0) {
      results[botName].push("Profile guestbook write skipped: cooldown");
      return;
    }

    // Pick a random target: either another bot or a real user
    const botUserIds = new Set(bots.map(b => b.user_id as string));
    
    // 50/50 chance: write in another bot's or a real user's guestbook
    let targetUserId: string | null = null;
    let targetUsername: string | null = null;

    if (Math.random() < 0.5) {
      // Write in another bot's guestbook
      const otherBots = bots.filter(b => (b.user_id as string) !== (authorBot.user_id as string));
      if (otherBots.length > 0) {
        const target = otherBots[Math.floor(Math.random() * otherBots.length)];
        targetUserId = target.user_id as string;
        targetUsername = target.name as string;
      }
    }

    if (!targetUserId) {
      // Write in a real user's guestbook (recently active, non-bot)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeUsers } = await supabase
        .from("profiles")
        .select("user_id, username")
        .eq("is_bot", false)
        .eq("is_approved", true)
        .gte("last_seen", oneWeekAgo)
        .limit(20);

      if (!activeUsers || activeUsers.length === 0) {
        results[botName].push("Profile guestbook write: no targets");
        return;
      }

      const target = activeUsers[Math.floor(Math.random() * activeUsers.length)];
      targetUserId = target.user_id;
      targetUsername = target.username;
    }

    // Get target's profile info for context
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("city, interests, listens_to")
      .eq("user_id", targetUserId)
      .single();

    const profileContext = targetProfile
      ? `${targetUsername} bor i ${targetProfile.city || "okänt"}. Intressen: ${targetProfile.interests || "okänt"}. Lyssnar på: ${targetProfile.listens_to || "okänt"}.`
      : "";

    const res = await callBotRespond(supabaseUrl, {
      action: "profile_guestbook_write",
      bot_id: authorBot.id,
      target_id: targetUserId,
      target_username: targetUsername,
      profile_owner_id: targetUserId,
      context: profileContext,
    });

    results[botName].push(`Profile guestbook write to ${targetUsername}: ${res.reply || res.error || "unknown"}`);
  } catch (e) {
    console.error("Profile guestbook write error:", e);
  }
}

async function callBotRespond(
  supabaseUrl: string,
  body: Record<string, unknown>
) {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const res = await fetch(`${supabaseUrl}/functions/v1/bot-respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(body),
  });

  return await res.json();
}
