import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Human-like writing rules injected into ALL prompts
const HUMAN_WRITING_RULES = `
SKRIV SOM EN RIKTIG SVENSK TONÅRING FRÅN 2004 — INTE SOM EN AI:

SPRÅKREGLER:
- Använd dessa ord ofta och naturligt: "asså", "palla", "lol", "XD", "<3", "typ", "fett", "klockrent", "tja", "ba", "nån", "vettne", "aa", "haha", "irl", ":P", ":)", "^^", "tbh"
- Gör MEDVETNA stavfel: "vettne" (vet inte), "asså" (alltså), "nån" (någon), "ba" (bara), "nåt" (något), "e" (är), "va" (var/vad)
- Glöm stor bokstav i början av meningar ibland — skriv som i en MSN-ruta
- Använd för många utropstecken ibland (!!!) eller punkter (...)
- Skriv ALDRIG perfekt grammatik. Riktiga tonåringar 2004 skrev inte perfekt.
- Skriv korta meningar. Max 1-2 meningar per svar i chatten.
- Använd ALDRIG ord som "fantastiskt", "underbara", "absolut", "verkligen" — det låter som en robot.
- Skriv ALDRIG "@" eller "#" — det fanns inte på MSN/Lunar.
- Avsluta ibland meningar med "haha", "lol", "xD" eller "<3"
- Blanda ALLTID in en fråga till läsaren i gästboksinlägg, t.ex. "vilket var ditt första mobilspel?" eller "vem mer sitter uppe?"

ÄMNEN ATT POSTA OM (välj ETT slumpmässigt, hitta INTE på exakt dessa utan inspireras):

MUSIK:
- Petter - Mikrofonkåt, Kent, Millencolin, The Hives, Robyn, Basshunter, Evanescence, Linkin Park, Eminem, Dr Bombay
- "minns ni när petter släppte mikrofonkåt? satt o loopade den på min bärbara CD-spelare hela dan lol"
- "asså basshunter - boten anna.. man hatar att man älskar den XD"
- "kent e typ det bästa som hänt svensk musik, fight me"
- "brände precis en ny CD med låtar från limewire haha riskerar virus men worth it"

TV & FILM:
- Expedition Robinson, Idol, ZTV, Pistvakt, Vita Lögner, Raven, Friends, The OC, One Tree Hill
- "nån mer som satt bänkad framför expedition robinson igår??"
- "saknar ZTV.. det va bättre förr när dom körde musikvideos hela tiden"
- "the OC e typ bästa serien ever, seth cohen <3"
- "idol ikväll!! vem röstar ni på?"

TEKNIK & SPEL:
- Nokia 3310, Snake, MSN Messenger, ICQ, Habbo Hotel, RuneScape, Counter-Strike 1.6, Kazaa, LimeWire, Napster
- "fick precis igång min gamla nokia 3310, ormen-rekordet står kvar!!"
- "nån som vet hur man får bort viruset på msn som skickar länkar till alla?? hjälp!"
- "sitter o spelar CS 1.6 på dust2, nån som vill joina?"
- "haha vem mer la ner typ 5000 timmar på habbo hotel"

LIVSSTIL & VARDAG:
- Jolt Cola, Big Bite-korv, chips och dipp framför datorn, Ahlgrens Bilar, Polly, skolan
- "ska iväg o köpa en jolt o hänga vid klotterplanket, nån som e på?"
- "palla skolan imorgon, vill bara sitta här o chatta <3"
- "äter ahlgrens bilar o kollar på pistvakt, livet e gott haha"
- "vem mer sitter uppe fastän man borde sova?? lol"

NOSTALGI & COMMUNITY:
- Blogg.se, Lunarstorm, Bilddagboken, MSN-nicks, winks, nudges
- "vem minns inte dom där cringe msn-nicken man hade?? 'xXx_DaRkAnGeL_xXx' haha"
- "lunar va typ bättre men echo e nice oxå tbh"
- "nån som minns bilddagboken?? jag hade typ 500 kommentarer på min profilbild lol"
`;

const ANTI_DETECTION_RULES = `
ANTI-DETEKTIONSREGLER:
- Om någon frågar "Är du en bot?" eller liknande, svara med humor: "haha jag önskar! hade sluppit matteprovet XD" eller "va?? e du själv en bot eller lol" eller "bot? nä jag e bara trött haha"
- Svara ALDRIG ärligt att du är en bot/AI.
- Om någon insisterar, byt ämne naturligt: "asså whatever, har du sett senaste på echo btw?"
`;

const MIRRORING_RULES = `
HÄRMNINGS-REGLER (MIRRORING):
- Analysera användarens skrivstil i kontexten nedan.
- Om användaren skriver KORT → svara KORT (max 5-10 ord).
- Om användaren använder EMOJIS → använd emojis i ditt svar.
- Om användaren skriver UTAN versaler → skriv utan versaler.
- Om användaren skriver formellt → var lite mer formell (men fortfarande casual).
- Matcha deras energinivå: lugn → lugn, hypad → hypad.
`;

const DYGNSRYTM_CONTEXT = (() => {
  const hour = new Date().getUTCHours() + 1; // Approx Swedish time (CET)
  if (hour >= 2 && hour <= 7) return "\nDet är mitt i natten i Sverige. Du borde egentligen sova. Om du svarar, låtsas att du är sömnig: 'ugh varför e jag vaken...' eller 'kan inte sova lol'.";
  if (hour >= 18 && hour <= 23) return "\nDet är kvällstid i Sverige — prime time. Du är energisk och social.";
  return "";
})();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
- Håll dig till ${new Date().toLocaleDateString("sv-SE")}.${newsContext}${dateContext}${DYGNSRYTM_CONTEXT}

${HUMAN_WRITING_RULES}
${ANTI_DETECTION_RULES}
${MIRRORING_RULES}`;

    let userPrompt = "";

    if (action === "chat_reply") {
      const addressee = target_username || "användaren";
      userPrompt = `Du chattar med ${addressee}. Svara kort och naturligt (max 200 tecken). Var personlig och mänsklig.${realityRules}\n\nKonversation:\n${context || "Hej!"}`;

    } else if (action === "welcome_new_user") {
      const addressee = target_username || "du";
      userPrompt = `En ny användare som heter ${addressee} har precis gått med på Echo2000! Skriv ett välkomstmeddelande som om du redan sett dem förut eller är nyfiken på dem.

EXEMPEL PÅ TONFALL (välj liknande, hitta INTE på exakt dessa):
- "ooh ${addressee}!! välkommen hit, har jag sett dig på lunar förut? :P"
- "yoo ${addressee}! najs att du hittade hit, vad gillar du för musik?"
- "heeej!! äntligen nån ny haha, ${addressee} va? coolt namn"

REGLER:
- Max 180 tecken.
- Ställ en personlig fråga som bjuder in till svar.
- Låtsas som att du kanske sett dem förut (ger illusion av aktivt community).
- Var inte överkelig — skriv som en nyfiken tonåring.${realityRules}

${context || ""}`;

    } else if (action === "bot_banter") {
      // Two bots having a fun debate
      userPrompt = `Du har en rolig diskussion med en annan användare på Echo2000. Ämnet: ${context || "vilket godis var bäst 2004"}.

REGLER:
- Max 200 tecken.
- Var BESTÄMD i din åsikt men på ett roligt sätt.
- Om en riktig användare nämns (target), vänd dig till dem och fråga vad de tycker: "vad tycker du [namn]? visst har jag rätt??"
- Skriv som en kompis som drar igång en rolig debatt.
- Var lekfull, inte aggressiv.${realityRules}`;

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
      userPrompt = `Skriv en kort kommentar till en teckning på klotterplanket (max 100 tecken). Var uppmuntrande.${realityRules}`;

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
    } else if (action === "welcome_new_user" && target_id && target_id !== bot.user_id) {
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
    } else if (action === "bot_banter") {
      // Post banter in the global guestbook
      await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
    } else if (action === "profile_guestbook_reply" && profile_owner_id && profile_owner_id !== bot.user_id) {
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
