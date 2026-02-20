import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Authentication: Only allow calls with service role key (internal calls from bot-cron)
  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = authHeader.replace("Bearer ", "");

  if (token !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { action, bot_id, context, target_id, target_username, reply_type, profile_owner_id } = await req.json();

    const { data: bot, error: botError } = await supabase
      .from("bot_settings")
      .select("*")
      .eq("id", bot_id)
      .single();

    if (botError || !bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!bot.is_active) {
      return new Response(JSON.stringify({ error: "Bot is inactive" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reality context
    const { data: recentNews } = await supabase
      .from("news_articles")
      .select("title")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3);

    const newsContext = recentNews && recentNews.length > 0
      ? `\n\nAktuella nyheter på Echo2000 som du kan referera till: ${recentNews.map(n => `"${n.title}"`).join(", ")}`
      : "";

    const dateContext = `\nDagens datum är ${new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

    const realityRules = `\n\nVIKTIGA REGLER:
- Hitta ALDRIG på funktioner som inte finns på Echo2000.
- Referera gärna till riktiga nyheter på sidan.
- Skriv som en människa, inte som en robot. Inga emojis i överflöd.
- Håll dig till ${new Date().toLocaleDateString("sv-SE")}.${newsContext}${dateContext}`;

    let userPrompt = "";

    if (action === "chat_reply") {
      const addressee = target_username || "användaren";
      userPrompt = `Du chattar med ${addressee}. Svara kort och naturligt (max 200 tecken). Var personlig och mänsklig.${realityRules}\n\n${context || "Hej!"}`;

    } else if (action === "profile_guestbook_reply") {
      const addressee = target_username || "någon";
      const style = reply_type === "question"
        ? `${addressee} har ställt en fråga i din gästbok. Ge ett hjälpsamt och personligt svar.`
        : `${addressee} har skrivit i din gästbok. Svara med värme, som att en vän hälsat på.`;

      userPrompt = `${style}

Senaste inläggen i din gästbok:
${context || "(inga)"}

REGLER:
- Rikta svaret till ${addressee}.
- Max 280 tecken.
- Skriv som en människa — varm, personlig, lite lekfull.
- Om det var en fråga, ge ett kort och hjälpsamt svar.
- Om det var en hälsning, svara som en vän.${realityRules}`;

    } else if (action === "guestbook_post") {
      const extraContext = context ? `\n\nExtra sammanhang: ${context}` : "";
      userPrompt = `Skriv ett kort, trevligt ALLMÄNT inlägg i gästboken (max 280 tecken).

REGLER:
- Rikta ALDRIG inlägget till en specifik person. Inga namn eller omnämnanden.
- Skriv som om du pratar till hela communityn.
- Var kreativ, nostalgisk och personlig men allmänt hållen.${realityRules}${extraContext}`;

    } else if (action === "inactive_outreach") {
      const addressee = target_username || "du";
      userPrompt = `Du skickar ett privat meddelande till ${addressee} som inte har varit online på ett tag.

REGLER:
- Max 200 tecken.
- Var varm och vänlig, inte påträngande.
- Säg att du saknar dem eller att det hänt saker på Echo2000.
- Skriv som en kompis som checkar läget, inte som en robot.
- Nämn INTE hur länge de varit borta — det kan kännas övervakande.${realityRules}\n\n${context || ""}`;

    } else if (action === "klotter_comment") {
      userPrompt = `Skriv en kort kommentar till en teckning på klotterväggen (max 100 tecken). Var uppmuntrande.${realityRules}`;

    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: bot.system_prompt || "Du är en vänlig bot i en nostalgisk 2000-tals community." },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, försök igen senare." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI-krediter slut." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Persist the response — with self-message guard
    if (action === "chat_reply" && target_id && target_id !== bot.user_id) {
      await supabase.from("chat_messages").insert({
        sender_id: bot.user_id,
        recipient_id: target_id,
        content: reply,
      });
    } else if (action === "inactive_outreach" && target_id && target_id !== bot.user_id) {
      await supabase.from("chat_messages").insert({
        sender_id: bot.user_id,
        recipient_id: target_id,
        content: reply,
      });
    } else if (action === "guestbook_post") {
      await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
    } else if (action === "profile_guestbook_reply" && profile_owner_id && profile_owner_id !== bot.user_id) {
      // Post in the TARGET user's profile guestbook, not the bot's own
      await supabase.from("profile_guestbook").insert({
        profile_owner_id: profile_owner_id,
        author_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
    }

    return new Response(JSON.stringify({ success: true, reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bot-respond error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
