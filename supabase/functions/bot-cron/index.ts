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
    // AUTO-ACCEPT friend requests & write "Tack för adden!"
    // =============================================
    await handleAutoAcceptFriendRequests(supabase, supabaseUrl, bots, results);

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
    // Lajv auto-fill: if lajv is empty for 10 min, force a bot post
    // =============================================
    await handleLajvAutoFill(supabase, supabaseUrl, bots, results);

    // =============================================
    // Lajv posts: occasional spontaneous status updates
    // =============================================
    await handleLajvPosts(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    // =============================================
    // Topic-based posts from internal knowledge base
    // =============================================
    await handleTopicPosts(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    // =============================================
    // Admin "Dagens Nyhet" — bots discuss admin-set topics
    // =============================================
    await handleDailyNewsPosts(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    // =============================================
    // Personality-driven news reactions (from news_articles)
    // =============================================
    await handleNewsReactions(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    // =============================================
    // Profile guestbook writing: bots visit and write in others' guestbooks
    // =============================================
    await handleProfileGuestbookWriting(supabase, supabaseUrl, bots, dygnsMultiplier, results);

    // =============================================
    // Social: profile visits, good vibes, lajv replies
    // =============================================
    await handleProfileVisits(supabase, bots, dygnsMultiplier, results);
    await handleGoodVibes(supabase, bots, dygnsMultiplier, results);
    await handleLajvReplies(supabase, supabaseUrl, bots, results);

    // =============================================
    // Cross-bot interaction: bots reply to each other's lajv posts
    // =============================================
    await handleCrossBotInteraction(supabase, supabaseUrl, bots, results);

    // =============================================
    // Creative: klotter drawings, scribble games, snake highscores
    // =============================================
    await handleKlotterDrawing(supabase, bots, dygnsMultiplier, results);
    await handleScribbleParticipation(supabase, bots, results);
    await handleSnakeHighscores(supabase, bots, dygnsMultiplier, results);

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

    // =============================================
    // 60% ONLINE RULE: Keep at least 60% of bots with recent last_seen
    // =============================================
    const totalBots = bots.length;
    const targetOnline = Math.ceil(totalBots * 0.6);
    const now = new Date();
    
    // Shuffle bots and pick 60%+ to be "online"
    const shuffledBots = [...bots].sort(() => Math.random() - 0.5);
    const onlineBots = shuffledBots.slice(0, targetOnline);
    
    for (const bot of onlineBots) {
      // Set last_seen to now with slight random offset (0-2 min ago) for realism
      const offset = Math.floor(Math.random() * 2 * 60 * 1000);
      const lastSeen = new Date(now.getTime() - offset).toISOString();
      await supabase.from("profiles").update({ last_seen: lastSeen }).eq("user_id", bot.user_id as string);
    }
    
    // Remaining bots: some "away" (3-8 min ago), some truly offline
    const remainingBots = shuffledBots.slice(targetOnline);
    for (const bot of remainingBots) {
      // 50% chance to be "away", 50% offline
      if (Math.random() < 0.5) {
        const awayOffset = 3 * 60 * 1000 + Math.floor(Math.random() * 5 * 60 * 1000); // 3-8 min
        const lastSeen = new Date(now.getTime() - awayOffset).toISOString();
        await supabase.from("profiles").update({ last_seen: lastSeen }).eq("user_id", bot.user_id as string);
      }
      // else: leave their last_seen as-is (offline)
    }

    // Also update last_seen for bots that actually DID something this cycle
    const activeBotUserIds = Object.entries(results)
      .filter(([_, msgs]) => msgs.some(m => !m.includes("Skipped") && !m.includes("cooldown") && !m.includes("skipped")))
      .map(([name]) => bots.find(b => b.name === name)?.user_id)
      .filter(Boolean) as string[];

    for (const uid of activeBotUserIds) {
      await supabase.from("profiles").update({ last_seen: now.toISOString() }).eq("user_id", uid);
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
    // Human-like delay: only reply to entries older than 3 minutes
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: recentEntries } = await supabase
      .from("profile_guestbook")
      .select("id, author_name, author_id, message, profile_owner_id, created_at")
      .eq("profile_owner_id", bot.user_id)
      .neq("author_id", bot.user_id)
      .gte("created_at", thirtyMinAgo)
      .lte("created_at", threeMinAgo) // Only entries at least 3 min old
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
    // Human-like delay: only reply to messages older than 2 minutes
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: recentMsgs } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("recipient_id", bot.user_id)
      .eq("is_read", false)
      .lte("created_at", twoMinAgo) // Only messages at least 2 min old
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentMsgs || recentMsgs.length === 0) return false;

    // Additional human-like delay: randomly skip if message is less than 5 min old (50% chance)
    const oldestMsg = recentMsgs[recentMsgs.length - 1];
    const msgAge = Date.now() - new Date(oldestMsg.created_at).getTime();
    const msgAgeMin = msgAge / (1000 * 60);
    if (msgAgeMin < 5 && Math.random() < 0.5) {
      results[bot.name as string].push(`Chat reply delayed: message only ${msgAgeMin.toFixed(1)} min old, will reply later`);
      return false;
    }

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
    const chance = 0.12 * dygnsMultiplier;
    
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
    // ~12% chance per cycle × dygnsrytm (increased for more visibility)
    if (Math.random() > 0.12 * dygnsMultiplier) return;

    // Pick a random bot as author
    const authorBot = bots[Math.floor(Math.random() * bots.length)];
    const botName = authorBot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: no profile guestbook write from this bot in last 45 min
    const twoHoursAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
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

// =============================================
// Profile visits: bots randomly visit profiles
// =============================================
async function handleProfileVisits(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    if (Math.random() > 0.06 * dygnsMultiplier) return;
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username")
      .neq("user_id", bot.user_id)
      .eq("is_bot", false)
      .limit(30);

    if (!profiles || profiles.length === 0) return;

    const targets = [...profiles].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(Math.random() * 3));
    for (const p of targets) {
      const { error } = await supabase.from("profile_visits").insert({
        visitor_id: bot.user_id as string,
        profile_owner_id: p.user_id,
      });
      if (!error) results[botName].push(`Visited ${p.username}`);
    }
  } catch (e) { console.error("Profile visits error:", e); }
}

// =============================================
// Good vibes: bots like random content
// =============================================
async function handleGoodVibes(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    if (Math.random() > 0.08 * dygnsMultiplier) return;
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    const targetTypes = ["guestbook", "lajv", "profile"];
    const targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    let targetId: string | null = null;

    if (targetType === "guestbook") {
      const { data } = await supabase.from("guestbook_entries").select("id").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) targetId = data[Math.floor(Math.random() * data.length)].id;
    } else if (targetType === "lajv") {
      const { data } = await supabase.from("lajv_messages").select("id").order("created_at", { ascending: false }).limit(10);
      if (data && data.length > 0) targetId = data[Math.floor(Math.random() * data.length)].id;
    } else {
      const { data } = await supabase.from("profiles").select("user_id").eq("is_bot", false).limit(20);
      if (data && data.length > 0) targetId = data[Math.floor(Math.random() * data.length)].user_id;
    }
    if (!targetId) return;

    // Check if already vibed
    const { data: existing } = await supabase.from("good_vibes")
      .select("id").eq("giver_id", bot.user_id).eq("target_type", targetType).eq("target_id", targetId).limit(1);
    if (existing && existing.length > 0) return;

    const { error } = await supabase.from("good_vibes").insert({
      giver_id: bot.user_id as string,
      target_type: targetType,
      target_id: targetId,
    });
    if (!error) results[botName].push(`Gave ❤️ to ${targetType}:${targetId.slice(0, 8)}`);
  } catch (e) { console.error("Good vibes error:", e); }
}

// =============================================
// Lajv replies: bots respond to recent lajv messages
// =============================================
async function handleLajvReplies(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const botUserIds = new Set(bots.map(b => b.user_id as string));

    const { data: recentLajv } = await supabase
      .from("lajv_messages")
      .select("*")
      .gte("created_at", fiveMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentLajv || recentLajv.length === 0) return;

    const humanMessages = recentLajv.filter(m => !botUserIds.has(m.user_id));
    if (humanMessages.length === 0) return;

    for (const msg of humanMessages) {
      const hasQuestion = msg.message.includes("?");
      const mentionsBot = bots.some(b => msg.message.toLowerCase().includes((b.name as string).toLowerCase()));
      if (!hasQuestion && !mentionsBot && Math.random() > 0.15) continue;

      let respondBot = bots[Math.floor(Math.random() * bots.length)];
      if (mentionsBot) {
        const mentioned = bots.find(b => msg.message.toLowerCase().includes((b.name as string).toLowerCase()));
        if (mentioned) respondBot = mentioned;
      }

      const botName = respondBot.name as string;
      results[botName] = results[botName] || [];

      // Cooldown
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recentBotLajv } = await supabase.from("lajv_messages")
        .select("id").eq("user_id", respondBot.user_id).gte("created_at", tenMinAgo).limit(1);
      if (recentBotLajv && recentBotLajv.length > 0) continue;

      const context = `${msg.username} sa nyss i lajv: "${msg.message}". Svara naturligt som en spontan lajv-uppdatering. Referera till ämnet utan att nämna namn direkt.`;
      const res = await callBotRespond(supabaseUrl, {
        action: "lajv_post",
        bot_id: respondBot.id,
        context,
      });
      results[botName].push(`Lajv reply: ${res.reply || res.error || "unknown"}`);
      break;
    }
  } catch (e) { console.error("Lajv replies error:", e); }
}

// =============================================
// Klotter drawing: bots create SVG drawings
// =============================================
const KLOTTER_COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FF69B4", "#98D8C8", "#F7DC6F", "#BB8FCE", "#82E0AA", "#F1948A"];

const KLOTTER_TEMPLATES: Array<{ comment: string; draw: (c: string) => string }> = [
  { comment: "haha :)", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><circle cx="200" cy="120" r="60" fill="none" stroke="${c}" stroke-width="3"/><circle cx="180" cy="105" r="5" fill="${c}"/><circle cx="220" cy="105" r="5" fill="${c}"/><path d="M175 140 Q200 165 225 140" fill="none" stroke="${c}" stroke-width="3"/></svg>` },
  { comment: "<3 <3 <3", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><path d="M200 230 C200 230 110 165 110 125 C110 85 145 70 175 85 C185 92 195 105 200 115 C205 105 215 92 225 85 C255 70 290 85 290 125 C290 165 200 230 200 230Z" fill="${c}" opacity="0.8"/></svg>` },
  { comment: "heja echo2000!!", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="150" text-anchor="middle" fill="${c}" font-size="36" font-family="Impact,sans-serif">ECHO2000</text><text x="200" y="190" text-anchor="middle" fill="${c}" font-size="18" opacity="0.7">★ Bäst på nätet ★</text></svg>` },
  { comment: "nostalgi lol", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="120" text-anchor="middle" fill="${c}" font-size="48">🎵</text><text x="200" y="180" text-anchor="middle" fill="${c}" font-size="24" font-family="Comic Sans MS,cursive">2004 forever</text><text x="200" y="220" text-anchor="middle" fill="${c}" font-size="16" opacity="0.6">⭐ ⭐ ⭐</text></svg>` },
  { comment: "peace ✌️", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><circle cx="200" cy="150" r="80" fill="none" stroke="${c}" stroke-width="3"/><line x1="200" y1="70" x2="200" y2="230" stroke="${c}" stroke-width="3"/><line x1="200" y1="150" x2="144" y2="206" stroke="${c}" stroke-width="3"/><line x1="200" y1="150" x2="256" y2="206" stroke="${c}" stroke-width="3"/></svg>` },
  { comment: "sol o värme pls", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><circle cx="200" cy="150" r="50" fill="${c}" opacity="0.8"/><line x1="200" y1="80" x2="200" y2="50" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="200" y1="220" x2="200" y2="250" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="130" y1="150" x2="100" y2="150" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="270" y1="150" x2="300" y2="150" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="150" y1="100" x2="130" y2="80" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="250" y1="100" x2="270" y2="80" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="150" y1="200" x2="130" y2="220" stroke="${c}" stroke-width="3" stroke-linecap="round"/><line x1="250" y1="200" x2="270" y2="220" stroke="${c}" stroke-width="3" stroke-linecap="round"/></svg>` },
  { comment: "go go MSN!", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="100" text-anchor="middle" fill="${c}" font-size="32" font-family="Impact,sans-serif">MSN</text><text x="200" y="140" text-anchor="middle" fill="${c}" font-size="20">MESSENGER</text><text x="200" y="210" text-anchor="middle" fill="${c}" font-size="48">💬</text></svg>` },
  { comment: "nån vaken?? xD", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="130" text-anchor="middle" fill="${c}" font-size="28" font-family="Comic Sans MS,cursive">nån vaken??</text><text x="200" y="200" text-anchor="middle" fill="${c}" font-size="48">😴</text></svg>` },
  { comment: "snake highscore!", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><rect x="100" y="140" width="20" height="20" fill="${c}"/><rect x="120" y="140" width="20" height="20" fill="${c}"/><rect x="140" y="140" width="20" height="20" fill="${c}"/><rect x="160" y="140" width="20" height="20" fill="${c}"/><rect x="160" y="120" width="20" height="20" fill="${c}"/><rect x="180" y="120" width="20" height="20" fill="${c}"/><rect x="200" y="120" width="20" height="20" fill="${c}"/><circle cx="280" cy="140" r="8" fill="#FF4444"/><text x="200" y="220" text-anchor="middle" fill="${c}" font-size="16" opacity="0.7">nom nom 🐍</text></svg>` },
  { comment: "heja sverige!! 🇸🇪", draw: (_c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><rect x="100" y="80" width="200" height="140" fill="#005BAC" rx="4"/><rect x="100" y="135" width="200" height="30" fill="#FECC02"/><rect x="170" y="80" width="30" height="140" fill="#FECC02"/><text x="200" y="260" text-anchor="middle" fill="#FECC02" font-size="18" font-family="sans-serif">Heja Sverige!!</text></svg>` },
  { comment: "kent 4ever", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="100" text-anchor="middle" fill="${c}" font-size="42" font-family="Georgia,serif" font-style="italic">kent</text><text x="200" y="150" text-anchor="middle" fill="${c}" font-size="18" opacity="0.6">– bästa bandet –</text><text x="200" y="230" text-anchor="middle" fill="${c}" font-size="36">🎸</text></svg>` },
  { comment: "XD", draw: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" style="background:#1e2540"><text x="200" y="180" text-anchor="middle" fill="${c}" font-size="120" font-family="Impact,sans-serif">XD</text></svg>` },
];

async function handleKlotterDrawing(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    if (Math.random() > 0.03 * dygnsMultiplier) return;

    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: 4 hours
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase.from("klotter")
      .select("id").eq("user_id", bot.user_id).gte("created_at", fourHoursAgo).limit(1);
    if (recent && recent.length > 0) { results[botName].push("Klotter: cooldown"); return; }

    const template = KLOTTER_TEMPLATES[Math.floor(Math.random() * KLOTTER_TEMPLATES.length)];
    const color = KLOTTER_COLORS[Math.floor(Math.random() * KLOTTER_COLORS.length)];
    const svgContent = template.draw(color);
    const svgBytes = new TextEncoder().encode(svgContent);
    const filePath = `bot-drawings/${bot.user_id}/${Date.now()}.svg`;

    const { error: uploadError } = await supabase.storage
      .from("klotter")
      .upload(filePath, svgBytes, { contentType: "image/svg+xml", upsert: true });

    if (uploadError) { results[botName].push(`Klotter upload error: ${uploadError.message}`); return; }

    const { data: urlData } = supabase.storage.from("klotter").getPublicUrl(filePath);

    let botAvatar = bot.avatar_url as string | null;
    if (!botAvatar) {
      const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
      botAvatar = p?.avatar_url || null;
    }

    const { error: insertError } = await supabase.from("klotter").insert({
      user_id: bot.user_id as string,
      image_url: urlData.publicUrl,
      comment: template.comment,
      author_name: botName,
      author_avatar: botAvatar,
    });

    if (insertError) { results[botName].push(`Klotter error: ${insertError.message}`); return; }
    results[botName].push(`Klotter: "${template.comment}" 🎨`);
  } catch (e) { console.error("Klotter drawing error:", e); }
}

// =============================================
// Scribble: bots join games and submit guesses
// =============================================
const SCRIBBLE_WRONG_GUESSES = [
  "hund", "katt", "hus", "sol", "träd", "bil", "boll", "blomma", "fisk", "båt",
  "stol", "bord", "lampa", "bok", "penna", "äpple", "banan", "pizza", "glass",
  "gitarr", "hjärta", "stjärna", "moln", "regn", "snö", "eld", "vatten", "berg",
  "cykel", "telefon", "dator", "sko", "hatt", "klocka", "nyckel", "paraply",
];

async function handleScribbleParticipation(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const { data: lobbies } = await supabase
      .from("scribble_lobbies")
      .select("id, status, current_word, current_drawer_id")
      .in("status", ["waiting", "playing"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (!lobbies || lobbies.length === 0) return;

    for (const lobby of lobbies) {
      // Join waiting lobbies
      if (lobby.status === "waiting") {
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const botName = bot.name as string;
        results[botName] = results[botName] || [];

        const { data: existing } = await supabase.from("scribble_players")
          .select("id").eq("lobby_id", lobby.id).eq("user_id", bot.user_id).limit(1);
        if (existing && existing.length > 0) continue;

        let botAvatar = bot.avatar_url as string | null;
        if (!botAvatar) {
          const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
          botAvatar = p?.avatar_url || null;
        }

        const { error } = await supabase.from("scribble_players").insert({
          lobby_id: lobby.id,
          user_id: bot.user_id as string,
          username: botName,
          avatar_url: botAvatar,
        });
        if (!error) results[botName].push(`Joined scribble ${lobby.id.slice(0, 8)}`);
      }

      // Guess in active games
      if (lobby.status === "playing" && lobby.current_word) {
        const { data: botPlayers } = await supabase.from("scribble_players")
          .select("user_id, username")
          .eq("lobby_id", lobby.id)
          .in("user_id", bots.map(b => b.user_id as string));

        if (!botPlayers) continue;
        const guessers = botPlayers.filter(p => p.user_id !== lobby.current_drawer_id);

        for (const guesser of guessers) {
          const { data: correctGuess } = await supabase.from("scribble_guesses")
            .select("id").eq("lobby_id", lobby.id).eq("user_id", guesser.user_id).eq("is_correct", true).limit(1);
          if (correctGuess && correctGuess.length > 0) continue;

          const { data: prevGuesses } = await supabase.from("scribble_guesses")
            .select("id").eq("lobby_id", lobby.id).eq("user_id", guesser.user_id);
          const guessCount = prevGuesses?.length || 0;

          let guess: string;
          let isCorrect = false;

          if (guessCount >= 2 + Math.floor(Math.random() * 2)) {
            guess = lobby.current_word;
            isCorrect = true;
          } else {
            guess = SCRIBBLE_WRONG_GUESSES[Math.floor(Math.random() * SCRIBBLE_WRONG_GUESSES.length)];
            if (Math.random() < 0.3 && guess.length > 3) {
              const pos = Math.floor(Math.random() * (guess.length - 1));
              guess = guess.slice(0, pos) + guess[pos + 1] + guess[pos] + guess.slice(pos + 2);
            }
          }

          const { error } = await supabase.from("scribble_guesses").insert({
            lobby_id: lobby.id,
            user_id: guesser.user_id,
            username: guesser.username,
            guess,
            is_correct: isCorrect,
          });

          results[guesser.username] = results[guesser.username] || [];
          if (!error) results[guesser.username].push(`Scribble guess: "${guess}" ${isCorrect ? "✅" : "❌"}`);
        }
      }
    }
  } catch (e) { console.error("Scribble participation error:", e); }
}

// =============================================
// Auto-accept friend requests & write "Tack för adden!"
// =============================================
async function handleAutoAcceptFriendRequests(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const botUserIds = bots.map(b => b.user_id as string);

    // Find pending friend requests WHERE bots are the friend_id (receiver)
    const { data: pendingRequests } = await supabase
      .from("friends")
      .select("id, user_id, friend_id, created_at")
      .in("friend_id", botUserIds)
      .eq("status", "pending");

    if (!pendingRequests || pendingRequests.length === 0) return;

    for (const req of pendingRequests) {
      // Random delay: only accept if request is >10 minutes old
      const requestAge = Date.now() - new Date(req.created_at).getTime();
      const minDelay = 10 * 60 * 1000; // 10 min
      if (requestAge < minDelay) continue;

      // Random chance to delay further (up to 2 hours simulation)
      const maxDelay = 2 * 60 * 60 * 1000;
      if (requestAge < maxDelay && Math.random() > 0.3) continue;

      // Accept!
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", req.id);

      if (error) continue;

      const bot = bots.find(b => (b.user_id as string) === req.friend_id);
      if (!bot) continue;

      const botName = bot.name as string;
      results[botName] = results[botName] || [];
      results[botName].push(`Accepted friend request from ${req.user_id.slice(0, 8)}`);

      // Write "Tack för adden!" in their guestbook
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", req.user_id)
        .single();

      const senderName = senderProfile?.username || "du";

      const res = await callBotRespond(supabaseUrl, {
        action: "profile_guestbook_write",
        bot_id: bot.id,
        target_id: req.user_id,
        target_username: senderName,
        profile_owner_id: req.user_id,
        context: `${senderName} har precis lagt till dig som vän! Skriv ett kort, glatt tack-meddelande i deras gästbok. Typ "tack för adden!!" eller liknande.`,
      });

      results[botName].push(`Guestbook tack to ${senderName}: ${res.reply || res.error || "unknown"}`);

      // Update last_seen for the bot
      await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", req.friend_id);
    }
  } catch (e) {
    console.error("Auto-accept friend requests error:", e);
  }
}

// =============================================
// PERSONALITY_INTERESTS: maps personality → topic categories
// =============================================
const PERSONALITY_INTERESTS: Record<string, string[]> = {
  nostalgikern: ["musik", "teknik", "nostalgi"],
  kortansen: ["spel", "teknik", "dator"],
  gladansen: ["musik", "star", "hjarta"],
  dramansen: ["star", "musik", "hjarta"],
  filosofansen: ["dator", "teknik", "spel"],
};

// =============================================
// Topic-based posts from internal knowledge base
// =============================================
async function handleTopicPosts(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    // ~8% chance per cycle × dygnsrytm
    if (Math.random() > 0.08 * dygnsMultiplier) return;

    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentPosts } = await supabase
      .from("lajv_messages")
      .select("id")
      .eq("user_id", bot.user_id)
      .gte("created_at", oneHourAgo)
      .limit(2);

    if (recentPosts && recentPosts.length >= 2) {
      results[botName].push("Topic post skipped: cooldown");
      return;
    }

    // Interest matching: pick a topic that matches this bot's personality
    const personality = bot.tone_of_voice as string || "nostalgikern";
    const interests = PERSONALITY_INTERESTS[personality] || PERSONALITY_INTERESTS["nostalgikern"];

    // Import TOPIC_LIBRARY inline (duplicated from bot-respond for independence)
    const TOPICS = [
      { text: "Minns ni när man brände CD-skivor åt varandra? Bästa mixtapen wins", categories: ["musik", "nostalgi"] },
      { text: "Kent la ner... fortfarande inte över det tbh", categories: ["musik", "nostalgi"] },
      { text: "Basshunter - Boten Anna. Det var PEAK internet", categories: ["musik", "nostalgi"] },
      { text: "Evanescence var typ hela min personlighet 2004", categories: ["musik", "nostalgi"] },
      { text: "Vem hade bäst MSN-nick med songlyrics?", categories: ["musik", "nostalgi"] },
      { text: "Nokia 3310 var typ oförstörbar", categories: ["teknik", "nostalgi"] },
      { text: "Minns ni LimeWire?", categories: ["teknik", "nostalgi"] },
      { text: "MSN Messenger > alla moderna chattar", categories: ["teknik", "nostalgi"] },
      { text: "Lunarstorm var typ svenska internet-hemmet", categories: ["teknik", "nostalgi"] },
      { text: "CS 1.6 på datasal efter skolan", categories: ["spel", "nostalgi"] },
      { text: "Habbo Hotel... 'bobba'", categories: ["spel", "nostalgi"] },
      { text: "RuneScape tog ju typ hela ens barndom", categories: ["spel", "nostalgi"] },
      { text: "Vilken musik streamar ni just nu?", categories: ["musik"] },
      { text: "Robyn är fortfarande bäst", categories: ["musik"] },
      { text: "Nya GTA-trailern ser fett ut tbh", categories: ["spel"] },
      { text: "Nån som fortfarande spelar CS2?", categories: ["spel"] },
      { text: "AI tar över allt snart... typ skynet-vibbar", categories: ["teknik"] },
      { text: "TikTok vs YouTube shorts — vem vinner?", categories: ["teknik"] },
      { text: "Expedition Robinson borde göra comeback", categories: ["star"] },
      { text: "Vilken serie binge-watchar ni?", categories: ["star"] },
      { text: "Jolt Cola > alla energidrycker", categories: ["nostalgi"] },
      { text: "Nån mer som saknar Pistvakt?", categories: ["star", "nostalgi"] },
      { text: "ZTV var ba en helt annan värld", categories: ["star", "nostalgi"] },
      { text: "Ahlgrens bilar eller polly?", categories: ["nostalgi"] },
      { text: "Vilka indie-spel har ni kört på sistone?", categories: ["spel"] },
      { text: "Retro-gaming är ba det bästa. SNES > allt", categories: ["spel", "nostalgi"] },
      { text: "Spotify Wrapped var typ det viktigaste eventet", categories: ["musik"] },
      { text: "Fredagsmys med tacos — det mest svenska som finns", categories: ["star"] },
      { text: "Saknar ni flip-phones ibland?", categories: ["teknik", "nostalgi"] },
      { text: "Blogg.se var content creation innan det hette content creation", categories: ["teknik", "nostalgi"] },
    ];

    // Filter topics matching this bot's interests
    const matchingTopics = TOPICS.filter(t =>
      t.categories.some(c => interests.includes(c))
    );

    if (matchingTopics.length === 0) return;

    const chosenTopic = matchingTopics[Math.floor(Math.random() * matchingTopics.length)];

    const res = await callBotRespond(supabaseUrl, {
      action: "topic_post",
      bot_id: bot.id,
      context: chosenTopic.text,
    });

    results[botName].push(`Topic post "${chosenTopic.text.substring(0, 30)}...": ${res.reply || res.error || "unknown"}`);
  } catch (e) {
    console.error("Topic posts error:", e);
  }
}

// =============================================
// Admin "Dagens Nyhet" — bots discuss admin-set daily news
// =============================================
async function handleDailyNewsPosts(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    // ~10% chance per cycle × dygnsrytm
    if (Math.random() > 0.10 * dygnsMultiplier) return;

    // Get active daily news (not expired)
    const { data: dailyNews } = await supabase
      .from("daily_news")
      .select("id, content, created_at, expires_at")
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(3);

    if (!dailyNews || dailyNews.length === 0) return;

    const chosenNews = dailyNews[Math.floor(Math.random() * dailyNews.length)];
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: 30 min
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase
      .from("lajv_messages")
      .select("id")
      .eq("user_id", bot.user_id)
      .gte("created_at", thirtyMinAgo)
      .limit(1);
    if (recentLajv && recentLajv.length > 0) return;

    const res = await callBotRespond(supabaseUrl, {
      action: "daily_news_post",
      bot_id: bot.id,
      context: chosenNews.content,
    });

    results[botName].push(`Daily news post: ${res.reply || res.error || "unknown"}`);
  } catch (e) {
    console.error("Daily news posts error:", e);
  }
}

// =============================================
// Personality-driven news reactions (from news_articles)
// =============================================
async function handleNewsReactions(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    // ~6% chance per cycle × dygnsrytm
    if (Math.random() > 0.06 * dygnsMultiplier) return;

    // Get recent published news articles
    const { data: newsArticles } = await supabase
      .from("news_articles")
      .select("id, title, content")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!newsArticles || newsArticles.length === 0) return;

    const article = newsArticles[Math.floor(Math.random() * newsArticles.length)];
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase
      .from("lajv_messages")
      .select("id")
      .eq("user_id", bot.user_id)
      .gte("created_at", oneHourAgo)
      .limit(2);
    if (recentLajv && recentLajv.length >= 2) return;

    const res = await callBotRespond(supabaseUrl, {
      action: "news_reaction",
      bot_id: bot.id,
      context: `${article.title}: ${article.content.substring(0, 200)}`,
    });

    results[botName].push(`News reaction to "${article.title.substring(0, 30)}...": ${res.reply || res.error || "unknown"}`);
  } catch (e) {
    console.error("News reactions error:", e);
  }
}

// =============================================
// Cross-bot interaction: bots reply to each other's lajv posts (30% chance)
// =============================================
async function handleCrossBotInteraction(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const botUserIds = new Set(bots.map(b => b.user_id as string));

    // Get recent bot lajv posts
    const { data: recentBotLajv } = await supabase
      .from("lajv_messages")
      .select("*")
      .gte("created_at", tenMinAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!recentBotLajv || recentBotLajv.length === 0) return;

    // Only consider posts from OTHER bots
    const botPosts = recentBotLajv.filter(m => botUserIds.has(m.user_id));
    if (botPosts.length === 0) return;

    for (const post of botPosts) {
      // 30% chance to trigger cross-bot reply
      if (Math.random() > 0.30) continue;

      // Find a bot with SHARED interests
      const posterBot = bots.find(b => (b.user_id as string) === post.user_id);
      if (!posterBot) continue;

      const posterPersonality = posterBot.tone_of_voice as string || "nostalgikern";
      const posterInterests = PERSONALITY_INTERESTS[posterPersonality] || [];

      // Find bots with overlapping interests
      const candidateBots = bots.filter(b => {
        if ((b.user_id as string) === post.user_id) return false;
        const bp = b.tone_of_voice as string || "nostalgikern";
        const bi = PERSONALITY_INTERESTS[bp] || [];
        return bi.some(i => posterInterests.includes(i));
      });

      if (candidateBots.length === 0) continue;

      const respondBot = candidateBots[Math.floor(Math.random() * candidateBots.length)];
      const botName = respondBot.name as string;
      results[botName] = results[botName] || [];

      // Cooldown: no lajv from this bot in last 15 min
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recentReply } = await supabase.from("lajv_messages")
        .select("id").eq("user_id", respondBot.user_id).gte("created_at", fifteenMinAgo).limit(1);
      if (recentReply && recentReply.length > 0) continue;

      const res = await callBotRespond(supabaseUrl, {
        action: "cross_bot_reply",
        bot_id: respondBot.id,
        context: post.message,
        target_username: post.username,
      });

      results[botName].push(`Cross-bot reply to ${post.username}: ${res.reply || res.error || "unknown"}`);
      break; // Only one cross-bot interaction per cycle
    }
  } catch (e) {
    console.error("Cross-bot interaction error:", e);
  }
}

// =============================================
// Lajv Auto-Fill: if no lajv messages in 10 min, force a bot post
// =============================================
async function handleLajvAutoFill(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  bots: Record<string, unknown>[],
  results: Record<string, string[]>
) {
  try {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentLajv } = await supabase
      .from("lajv_messages")
      .select("id")
      .gte("created_at", tenMinAgo)
      .limit(1);

    // If there ARE recent messages, skip
    if (recentLajv && recentLajv.length > 0) return;

    // Lajv is empty! Pick a random bot to fill the void
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    // Use topic_post with a random topic for variety
    const fillTopics = [
      "Tyst här... nån vaken?? 🌙",
      "Asså jag scrollar bara... typ dead internet vibes",
      "Minns ni flash-spel? Good times",
      "Ingen online?? Jag sitter här iaf lol",
      "Echo2000 > alla andra sidor. Just saying",
      "Vad gör ni en sån här tid? Jag prokrastinerar",
      "Nostalgi-tanke: MSN-ljud när nån loggade in = dopamin",
      "Testar om nån ser det här... hallå?",
      "Borde sova men scrollar istället. Klassiker",
      "Finns det nån som fortfarande lyssnar på radio? 📻",
    ];
    const topic = fillTopics[Math.floor(Math.random() * fillTopics.length)];

    const res = await callBotRespond(supabaseUrl, {
      action: "topic_post",
      bot_id: bot.id,
      context: topic,
    });

    results[botName].push(`Lajv auto-fill: ${res.reply || res.error || "unknown"}`);
  } catch (e) {
    console.error("Lajv auto-fill error:", e);
  }
}

// =============================================
// Snake Highscores: bots submit realistic game scores
// =============================================
async function handleSnakeHighscores(
  supabase: ReturnType<typeof createClient>,
  bots: Record<string, unknown>[],
  dygnsMultiplier: number,
  results: Record<string, string[]>
) {
  try {
    // ~3% chance per cycle × dygnsrytm
    if (Math.random() > 0.03 * dygnsMultiplier) return;

    const bot = bots[Math.floor(Math.random() * bots.length)];
    const botName = bot.name as string;
    results[botName] = results[botName] || [];

    // Cooldown: 6 hours per bot
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: recentScores } = await supabase
      .from("snake_highscores")
      .select("id")
      .eq("user_id", bot.user_id)
      .gte("created_at", sixHoursAgo)
      .limit(1);

    if (recentScores && recentScores.length > 0) {
      results[botName].push("Snake: cooldown");
      return;
    }

    // Generate realistic, varied scores:
    // 60% bad (5-30), 25% medium (30-80), 10% good (80-150), 5% great (150-250)
    const roll = Math.random();
    let score: number;
    let apples: number;
    let time: number;

    if (roll < 0.60) {
      // Bad scores — most common
      score = 5 + Math.floor(Math.random() * 25);
      apples = Math.floor(score / 5);
      time = 10 + Math.floor(Math.random() * 30);
    } else if (roll < 0.85) {
      // Medium scores
      score = 30 + Math.floor(Math.random() * 50);
      apples = Math.floor(score / 5);
      time = 30 + Math.floor(Math.random() * 60);
    } else if (roll < 0.95) {
      // Good scores
      score = 80 + Math.floor(Math.random() * 70);
      apples = Math.floor(score / 5);
      time = 60 + Math.floor(Math.random() * 120);
    } else {
      // Great scores — rare
      score = 150 + Math.floor(Math.random() * 100);
      apples = Math.floor(score / 5);
      time = 120 + Math.floor(Math.random() * 180);
    }

    let botAvatar = bot.avatar_url as string | null;
    if (!botAvatar) {
      const { data: p } = await supabase.from("profiles").select("avatar_url").eq("user_id", bot.user_id).single();
      botAvatar = p?.avatar_url || null;
    }

    const { error } = await supabase.from("snake_highscores").insert({
      user_id: bot.user_id as string,
      username: botName,
      avatar_url: botAvatar,
      score,
      apples_eaten: apples,
      time_seconds: time,
    });

    if (!error) {
      results[botName].push(`Snake score: ${score} pts (${apples} 🍎, ${time}s) 🐍`);
    } else {
      results[botName].push(`Snake error: ${error.message}`);
    }
  } catch (e) {
    console.error("Snake highscores error:", e);
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
