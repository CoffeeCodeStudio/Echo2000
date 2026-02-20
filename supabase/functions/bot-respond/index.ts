import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, bot_id, context, target_id, target_username, reply_type, profile_owner_id } = await req.json();

    // Fetch bot settings
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

    // Fetch recent news for reality context
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
- Hitta ALDRIG på funktioner som inte finns på Echo2000 (t.ex. musik, video, spel som inte existerar).
- Referera gärna till riktiga nyheter på sidan.
- KRITISKT: Adressera BARA den person du pratar med. Nämn INTE andra användare vid namn om du inte pratar med dem.
- Håll dig till ${new Date().toLocaleDateString("sv-SE")}.${newsContext}${dateContext}`;

    let userPrompt = "";

    if (action === "chat_reply") {
      const addressee = target_username || "användaren";
      userPrompt = `Du chattar med ${addressee}. Svara kort och naturligt (max 200 tecken). Adressera BARA ${addressee}, ingen annan.${realityRules}\n\n${context || "Hej!"}`;
    } else if (action === "guestbook_reply") {
      const addressee = target_username || "någon";
      const replyStyle = reply_type === "mention"
        ? `Någon har nämnt dig vid namn i gästboken! Svara ${addressee} personligt och trevligt.`
        : `Någon har ställt en fråga i gästboken. Svara hjälpsamt (eller lite busigt) till ${addressee}.`;

      userPrompt = `${replyStyle}

Senaste inläggen i gästboken:
${context || "(inga)"}

REGLER FÖR DITT SVAR:
- Rikta svaret till ${addressee} — du FÅR nämna deras namn.
- Max 280 tecken.
- Var personlig, varm och lite lekfull.
- Om det var en fråga, ge ett kort och hjälpsamt (eller busigt) svar.
- Om det var en hälsning eller omnämning, svara med charm.${realityRules}`;
    } else if (action === "profile_guestbook_reply") {
      const addressee = target_username || "någon";
      const replyStyle = reply_type === "mention"
        ? `Någon har nämnt dig vid namn i sin profilgästbok! Svara ${addressee} personligt.`
        : `Någon har ställt en fråga i sin profilgästbok. Svara hjälpsamt till ${addressee}.`;

      userPrompt = `${replyStyle}

Senaste inläggen i profilgästboken:
${context || "(inga)"}

REGLER FÖR DITT SVAR:
- Rikta svaret till ${addressee} — du FÅR nämna deras namn.
- Max 280 tecken.
- Det här är en personlig profilgästbok, inte den publika gästboken. Skriv som om du besöker deras profil.
- Var personlig, varm och lite lekfull.${realityRules}`;
    } else if (action === "guestbook_post") {
      const extraContext = context ? `\n\nExtra sammanhang: ${context}` : "";
      userPrompt = `Skriv ett kort, trevligt ALLMÄNT inlägg i gästboken (max 280 tecken).

KRITISKA REGLER FÖR GÄSTBOKEN:
- Rikta ALDRIG inlägget till en specifik person. Använd INGA namn, smeknamn eller "@"-omnämnanden.
- Skriv som om du pratar till hela communityn, t.ex. "Hej alla!", "God morgon Echo2000!" etc.
- Nämn ALDRIG enskilda användare — varken i hälsningar, frågor eller kommentarer.
- Det här är ett offentligt inlägg som alla ser. Var kreativ, nostalgisk och personlig men ALLMÄNT hållen.${realityRules}${extraContext}`;
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

    // Perform the action with the bot's user_id
    if (action === "chat_reply" && target_id) {
      await supabase.from("chat_messages").insert({
        sender_id: bot.user_id,
        recipient_id: target_id,
        content: reply,
      });
    } else if (action === "guestbook_post" || action === "guestbook_reply") {
      // Both autonomous posts and reactive replies go to the public guestbook
      await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
    } else if (action === "profile_guestbook_reply" && profile_owner_id) {
      // Reactive reply in someone's profile guestbook
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
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
