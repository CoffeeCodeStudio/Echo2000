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

      // Activity level determines probability
      const roll = Math.random() * 100;
      if (roll > bot.activity_level) {
        results[bot.name].push(`Skipped (roll ${roll.toFixed(0)} > level ${bot.activity_level})`);
        continue;
      }

      if (allowedContexts.length === 0) {
        results[bot.name].push("No allowed contexts configured");
        continue;
      }

      // Pick a random allowed action
      const chosenContext = allowedContexts[Math.floor(Math.random() * allowedContexts.length)];

      if (chosenContext === "guestbook") {
        try {
          // Fetch recent guestbook entries for context
          const { data: recentEntries } = await supabase
            .from("guestbook_entries")
            .select("author_name, message")
            .order("created_at", { ascending: false })
            .limit(10);

          // Filter out bot's own entries to avoid self-replies
          const othersEntries = recentEntries?.filter(e => e.author_name !== bot.name) || [];

          const contextStr = othersEntries.length > 0
            ? `\n\nSenaste inläggen i gästboken från andra användare:\n${othersEntries.map(e => `- ${e.author_name}: "${e.message}"`).join("\n")}`
            : "";

          const res = await callBotRespond(supabaseUrl, {
            action: "guestbook_post",
            bot_id: bot.id,
            context: contextStr,
            // No target_id — guestbook posts are public
          });
          results[bot.name].push(`Guestbook: ${res.reply || res.error || "unknown"}`);
        } catch (e) {
          results[bot.name].push(`Guestbook error: ${e.message}`);
        }
      } else if (chosenContext === "chat") {
        // Look for unread messages from ANY user
        const { data: recentMsgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("recipient_id", bot.user_id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMsgs && recentMsgs.length > 0) {
          // Group by sender to reply to different people
          const senderIds = [...new Set(recentMsgs.map(m => m.sender_id))];
          // Pick a random sender to reply to
          const chosenSenderId = senderIds[Math.floor(Math.random() * senderIds.length)];
          const senderMessages = recentMsgs.filter(m => m.sender_id === chosenSenderId);

          // Get sender profile
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", chosenSenderId)
            .single();

          const senderName = senderProfile?.username || "en användare";

          try {
            // Build context from ALL messages from this sender (for better conversation)
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
              target_id: chosenSenderId,  // Reply to the actual sender
              target_username: senderName,
            });
            // Mark ALL messages from this sender as read
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
        } else {
          results[bot.name].push("No unread messages, skipping chat");
        }
      } else if (chosenContext === "news") {
        // Fetch latest published news to comment on
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
              // No target_id — news comments are public guestbook posts
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
