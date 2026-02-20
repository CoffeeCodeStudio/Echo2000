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
            .limit(5);

          const contextStr = recentEntries && recentEntries.length > 0
            ? `\n\nSenaste inläggen i gästboken:\n${recentEntries.map(e => `- ${e.author_name}: "${e.message}"`).join("\n")}`
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
      } else if (chosenContext === "chat") {
        // Look for unread messages from ANY user, not just one specific person
        const { data: recentMsgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("recipient_id", bot.user_id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(10);

        if (recentMsgs && recentMsgs.length > 0) {
          // Reply to a random unread message (not always the latest)
          const msg = recentMsgs[Math.floor(Math.random() * recentMsgs.length)];

          // Get sender profile for context
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", msg.sender_id)
            .single();

          try {
            const contextStr = `Meddelande från ${senderProfile?.username || "en användare"}: "${msg.content}"`;
            const res = await callBotRespond(supabaseUrl, {
              action: "chat_reply",
              bot_id: bot.id,
              context: contextStr,
              target_id: msg.sender_id,
            });
            // Mark this message as read
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", msg.id);
            results[bot.name].push(`Chat reply to ${senderProfile?.username || msg.sender_id}: ${res.reply || res.error || "unknown"}`);
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
          // Post a guestbook entry referencing the news
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
