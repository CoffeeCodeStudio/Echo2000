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

    // Fetch all active bots
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

      // Activity level determines probability (0-100 → 0-1)
      // Each cron tick (every 5 min), roll the dice
      const roll = Math.random() * 100;
      if (roll > bot.activity_level) {
        results[bot.name].push(`Skipped (roll ${roll.toFixed(0)} > level ${bot.activity_level})`);
        continue;
      }

      // Decide action: 60% guestbook, 40% chat reply to recent message
      const actionRoll = Math.random();

      if (actionRoll < 0.6) {
        // Post to guestbook
        try {
          const res = await callBotRespond(supabaseUrl, supabase, {
            action: "guestbook_post",
            bot_id: bot.id,
          });
          results[bot.name].push(`Guestbook: ${res.reply || res.error || "unknown"}`);
        } catch (e) {
          results[bot.name].push(`Guestbook error: ${e.message}`);
        }
      } else {
        // Reply to a recent chat message sent TO the bot
        const { data: recentMsg } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("recipient_id", bot.user_id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (recentMsg) {
          try {
            const res = await callBotRespond(supabaseUrl, supabase, {
              action: "chat_reply",
              bot_id: bot.id,
              context: recentMsg.content,
              target_id: recentMsg.sender_id,
            });
            // Mark original message as read
            await supabase
              .from("chat_messages")
              .update({ is_read: true })
              .eq("id", recentMsg.id);
            results[bot.name].push(`Chat reply to ${recentMsg.sender_id}: ${res.reply || res.error || "unknown"}`);
          } catch (e) {
            results[bot.name].push(`Chat error: ${e.message}`);
          }
        } else {
          results[bot.name].push("No unread messages, skipping chat");
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
  _supabase: any,
  body: Record<string, unknown>
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
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
