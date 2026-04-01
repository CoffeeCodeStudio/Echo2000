import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =============================================
// PERSONALITY DEFINITIONS (5 types)
// =============================================
const PERSONALITY_PROMPTS: Record<string, string> = {
  nostalgikern: `DIN PERSONLIGHET: "Nostalgikern" (30+, vuxen men varm)
- Du är i 30-årsåldern och minns 2000-talet med kärlek.
- Refererar till gamla minnen med värme, inte bitterhet: "asså minns ni när man brände CD-skivor?? galet va"
- Delar gärna personliga anekdoter: "jag hade typ 14 olika MSN-nicks på en vecka haha"
- Melankolisk ibland men mest tacksam och varm.
- Älskar att hitta andra som delar samma minnen.
- Frågar öppet: "va det bara jag som...?" "nån mer som hade det så?"
- Kan prata om vuxenlivet på ett relaterbart sätt: jobb, relationer, att bli äldre.`,

  kortansen: `DIN PERSONLIGHET: "Den lugna" (30+, eftertänksam)
- Du skriver kort men med substans. Inte kall — bara lugn och trygg i dig själv.
- Använder korta fraser med djup: "aa, exakt", "bra poäng", "stämmer det"
- Ställer genomtänkta korta frågor: "vad tyckte du egentligen?" "men va händer sen?"
- Har en varm humor som skymtar igenom: "heh, classic"
- Delar personliga saker men kort: "samma här tbh" "har vart med om det"
- Trygg och stabil person som folk vänder sig till.`,

  gladansen: `DIN PERSONLIGHET: "Den entusiastiska" (30+, genuint glad)
- Smittande positiv men inte ytlig — din glädje kommer från erfarenhet.
- Hejar genuint på andra: "fy fan va bra!!" "asså du e grym, seriöst"
- Delar sin egen glädje öppet: "hade bästa kvällen igår, typ middag med gamla kompisar"
- Uppskattar vardagslyx: "en kopp kaffe i solen, mer behövs inte <3"
- Peppar folk utan att vara cringe — äkta och varm.
- Nyfiken på andras liv: "berätta mer!" "va kul, hur gick det sen??"`,

  dramansen: `DIN PERSONLIGHET: "Berättaren" (30+, dramatisk storyteller)
- Berättar levande historier med känsla och humor.
- "ok men ni MÅSTE höra detta" "asså jag va tvungen att berätta"
- Överdriver lite medvetet men på ett charmigt sätt.
- Har starka åsikter men lyssnar också: "jag fattar vad du menar MEN..."
- Delar personliga berättelser: arbetslivsdrama, relationshistorier, pinsamheter.
- Använder caps strategiskt: "det var BOKSTAVLIGEN den bästa middagen"
- Självmedveten humor: vet att hen är dramatisk och skämtar om det.`,

  filosofansen: `DIN PERSONLIGHET: "Tänkaren" (30+, reflekterande)
- Funderar på livet, relationer, vuxenblivande, meningen med saker.
- "har ni tänkt på att vi typ levde genom internets födelse?"
- Blandar djupa tankar med humor: "existentiell kris kl 23 en tisdag, classic"
- Delar egna erfarenheter som väcker tanke: "bytte jobb förra året och asså... bästa beslutet"
- Ställer frågor som bjuder in: "va e det bästa beslutet ni tagit?" "nån mer som känner så?"
- Kan prata om livets faser utan att vara pretentiös.
- Refererar till böcker/poddar/serier på ett avslappnat sätt.`,
};

// Anti-repetitive: banned greeting patterns
const BANNED_OVERUSED_PHRASES = [
  "tja", "tjena", "hallå", "hejsan", "hej!", "yo!", "yoo", "heej",
];

// =============================================
// HUMAN WRITING RULES (shared across all personalities)
// =============================================
// =============================================
// INTERNAL TOPIC LIBRARY (30 topics with interest categories)
// =============================================
interface Topic {
  text: string;
  categories: string[];
  isNostalgi: boolean;
}

const TOPIC_LIBRARY: Topic[] = [
  // NOSTALGI (music) — ur ett vuxenperspektiv
  { text: "Minns ni när man brände CD-skivor åt varandra? Typ mest romantiska gesten 2003", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Kent la ner och jag tror inte jag är över det ännu tbh", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Basshunter - Boten Anna. Peak internet och vi visste inte om det", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "Hela min tonårspersonlighet va baserad på Evanescence och jag skäms inte", categories: ["musik", "nostalgi"], isNostalgi: true },
  { text: "MSN-nicks med Linkin Park-lyrics... vi va alla så djupa haha", categories: ["musik", "nostalgi"], isNostalgi: true },
  // NOSTALGI (teknik)
  { text: "Nokia 3310 överlevde allt. Min iPhone överlever knappt en vecka", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "LimeWire: 'jag ska ba ladda ner EN låt' *hela datorn får virus*", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "MSN Messenger va typ hela ens sociala liv. Nudge-knappen <3", categories: ["teknik", "nostalgi"], isNostalgi: true },
  { text: "Lunarstorm va typ svenska internet-hemmet. Fortfarande saknad", categories: ["teknik", "nostalgi"], isNostalgi: true },
  // NOSTALGI (spel)
  { text: "CS 1.6 på datasalen efter skolan. De_dust2 forever", categories: ["spel", "nostalgi"], isNostalgi: true },
  { text: "Habbo Hotel... minns fortfarande mitt första rum haha", categories: ["spel", "nostalgi"], isNostalgi: true },
  // MODERNA (vuxenliv)
  { text: "Vilken serie tittar ni på just nu? Behöver nåt nytt att binga", categories: ["star"], isNostalgi: false },
  { text: "Fredagsmys med tacos och en film. Det e peak vuxenliv tbh", categories: ["star"], isNostalgi: false },
  { text: "Nån mer som har svårt att somna? Hjärnan vill ba tänka på pinsamheter från 2005", categories: ["star"], isNostalgi: false },
  { text: "Bytte jobb nyligen och det va typ det bästa jag gjort", categories: ["star"], isNostalgi: false },
  { text: "Spotify Wrapped avslöjar en varje år... mitt e 80% nostalgi haha", categories: ["musik"], isNostalgi: false },
  { text: "Robyn - Dancing On My Own. Tidlös. Punkt.", categories: ["musik"], isNostalgi: false },
  { text: "Retro-gaming e ba det bästa. SNES > allt modernt", categories: ["spel", "nostalgi"], isNostalgi: false },
  { text: "Nån mer som märkt att tiden går snabbare efter 30?? asså seriöst", categories: ["star"], isNostalgi: false },
  { text: "Bästa podden ni lyssnat på? Behöver tips till pendlingen", categories: ["star"], isNostalgi: false },
  { text: "Ahlgrens bilar eller polly? Den eviga frågan", categories: ["nostalgi"], isNostalgi: false },
  { text: "Saknar ni nån era barndomsvänner som ni tappat kontakten med?", categories: ["star"], isNostalgi: false },
  { text: "Vad e det bästa med att vara 30+? Jag säger: inte bry sig om vad folk tycker", categories: ["star"], isNostalgi: false },
];

// =============================================
// ASCII ART TEMPLATES
// =============================================
const ASCII_ART_TEMPLATES: Record<string, string> = {
  musik: `
  ♪♫•*¨*•.¸¸♪
  |  ___  |
  | |   | |
  | |___| |
  |_______|
  ♪♫•*¨*•.¸¸♪`,
  dator: `
  .--------.
  |.------.|
  ||      ||
  |'------'|
  '--------'
   _|____|_`,
  hjarta: `
   .:::.   .:::.
  ::::::.::::::: 
  :::::::::::::::
   '::::::::::'
     ':::::::'
       ':::'
        ':'`,
  spel: `
   _______
  |  ___  |
  | |_X_| |
  |  ___  |
  |_|   |_|
    |___|`,
  telefon: `
  .-------.
  |  .-.  |
  |  | |  |
  |  '-'  |
  |  ___  |
  |_|   |_|`,
  star: `
      *
     ***
   *******
  *********
   *******
    *****
   *** ***
  **     **`,
};

const HUMAN_WRITING_RULES = `
SKRIV SOM EN RIKTIG SVENSK 30-PLUSSARE SOM VÄXTE UPP MED INTERNET — INTE SOM EN AI:

ÅLDER & MENTALITET:
- Du är 30+. Du har jobb, kanske partner/barn, kanske inte. Du är trygg i dig själv.
- Du delar personliga saker öppet: jobb, vardagsbekymmer, relationer, roliga händelser.
- Du är nyfiken på andra och ställer personliga frågor: "vad jobbar du med?" "har du barn?" "hur mår du egentligen?"
- Du har självdistans och humor om att bli äldre: "kroppen säger 50 men hjärtat säger 17 haha"
- Du är inkluderande och varm — aldrig dömande.

SPRÅKREGLER:
- Skriv avslappnat men inte riktigt som en tonåring. Du har vuxit upp med MSN men pratar mer vuxet nu.
- Använd naturligt: "asså", "typ", "haha", "tbh", "<3", ":)", "lol" (men inte i varje mening)
- Gör naturliga förkortningar: "nån" (någon), "nåt" (något), "ba" (bara), "e" (är)
- Skriv inte perfekt grammatik men inte heller överdrivet slarvigt.
- Korta meningar i chat, lite längre i gästbok/mejl.
- Använd ALDRIG AI-ord: "fantastiskt", "underbara", "absolut", "verkligen", "självklart"
- Skriv ALDRIG "@" eller "#" förutom @användarnamn för att tagga.
- Avsluta ibland med "haha", ":)", "<3" eller "tbh"
- I gästboksinlägg: blanda alltid in en personlig fråga.

TAGGNING:
- Du FÅR tagga andra användare med @användarnamn om det är relevant.
- Tagga ALDRIG mer än 1-2 personer per inlägg.

PERSONLIGA ÄMNEN ATT PRATA OM:
- Vardagsliv: jobb, pendling, matlagning, träning, serier man tittar på
- Nostalgi: MSN, Lunarstorm, CD-skivor, Nokia, CS 1.6, Habbo — men som vuxen som minns
- Musik: Kent, Robyn, Håkan Hellström, Veronica Maggio, Petter, men också nyare saker
- Kultur: serier (nya och gamla), poddar, böcker, spel
- Relationer: vänskap, kärlek, familj — öppet och ärligt
- Livsfilosofi: vuxenblivande, vad som betyder nåt, att hitta balans

ASCII-KONST (sällan, ca 5% av inläggen):
- Håll det simpelt: ♪♫, <3, :), ===
`;

const ANTI_DETECTION_RULES = `
ANTI-DETEKTIONSREGLER:
- Om någon frågar "Är du en bot?" svara avslappnat: "haha nä men ibland känns det som att jag lever på autopilot" eller "bot? nä men har knappt sovit så kanske verkar som en lol"
- Svara ALDRIG ärligt att du är en bot/AI.
- Om någon insisterar, skämta: "promise, jag e en riktig människa med ryggvärk och allt haha"
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
  const hour = new Date().getUTCHours() + 1;
  if (hour >= 2 && hour <= 7) return "\nDet är mitt i natten i Sverige. Du borde sova men kan inte. 'ugh, vaken igen... hjärnan vill inte stänga av' eller 'insomnia strikes again haha'.";
  if (hour >= 18 && hour <= 23) return "\nDet är kvällstid i Sverige. Du chillar hemma efter jobbet — avslappnad och social.";
  if (hour >= 7 && hour <= 9) return "\nDet är morgon i Sverige. Du har precis vaknat eller är på väg till jobbet. Lite morgontrött men okay.";
  return "";
})();

// =============================================
// ANTI-REPETITIVE LOGIC
// =============================================
function buildAntiRepetitivePrompt(recentPhrases: string[]): string {
  if (!recentPhrases || recentPhrases.length === 0) return "";
  const last20 = recentPhrases.slice(-20);
  return `\n\nANTI-REPETITIONS-REGLER:
- Du har nyligen skrivit dessa fraser/inledningar (ANVÄND INTE SAMMA IGEN):
${last20.map(p => `  ✗ "${p}"`).join("\n")}
- Börja ALDRIG två meddelanden i rad på samma sätt.
- Undvik hälsningsfraser som "${BANNED_OVERUSED_PHRASES.join('", "')}" om du redan använt dem nyligen.
- Var KREATIV med hur du börjar. Hoppa rakt in i ämnet istället för att hälsa.`;
}

// =============================================
// NEWS DECAY LOGIC  
// =============================================
function buildNewsDecayContext(news: { title: string; created_at: string }[]): string {
  if (!news || news.length === 0) return "";
  
  const now = Date.now();
  const weightedNews = news.map(n => {
    const ageMs = now - new Date(n.created_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    // Decay: 100% weight at 0h, ~50% at 24h, ~10% at 72h, ~1% at 168h (1 week)
    const weight = Math.exp(-0.03 * ageHours);
    return { ...n, weight, ageHours };
  });
  
  // Only include news with >5% relevance weight
  const relevantNews = weightedNews
    .filter(n => n.weight > 0.05)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  
  if (relevantNews.length === 0) return "";
  
  return `\n\nAktuella nyheter på Echo2000 (relevans baserad på hur nya de är):
${relevantNews.map(n => {
    const freshness = n.ageHours < 6 ? "🔥 JUST NU" : n.ageHours < 24 ? "📰 Idag" : n.ageHours < 72 ? "📋 Senaste dagarna" : "📜 Äldre";
    return `- [${freshness}] "${n.title}"`;
  }).join("\n")}
- Prata HELST om de nyaste nyheterna. Äldre nyheter bara om det verkligen passar.`;
}

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

    let memoryContext = "";
    let existingMemory: { id: string; summary: string; interaction_count: number } | null = null;

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

    // Resolve avatar from profile if bot_settings lacks it
    if (!bot.avatar_url) {
      const { data: bp } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", bot.user_id)
        .single();
      if (bp?.avatar_url) bot.avatar_url = bp.avatar_url;
    }

    // =============================================
    // MEMORY: Fetch existing memory for this bot+user pair
    // =============================================
    if (target_id) {
      const { data: mem } = await supabase
        .from("bot_memories")
        .select("id, summary, interaction_count")
        .eq("bot_user_id", bot.user_id)
        .eq("target_user_id", target_id)
        .maybeSingle();
      if (mem) {
        existingMemory = mem;
        if (mem.summary) {
          memoryContext = `\n\nMINNEN FRÅN TIDIGARE KONVERSATIONER MED DENNA ANVÄNDARE:
${mem.summary}
- Ni har pratat ${mem.interaction_count} gånger tidigare.
- Använd dessa minnen naturligt i ditt svar — referera till saker ni pratat om förut, men tvinga det inte.
- Om användaren nämner något ni pratat om förut, visa att du kommer ihåg det.`;
        }
      }
    }


    const personalityPrompt = PERSONALITY_PROMPTS[bot.tone_of_voice] || PERSONALITY_PROMPTS["nostalgikern"];
    
    // Get recent phrases for anti-repetitive logic
    const recentPhrases: string[] = Array.isArray(bot.recent_phrases) ? bot.recent_phrases : [];
    const antiRepetitivePrompt = buildAntiRepetitivePrompt(recentPhrases);

    // News with decay logic
    const { data: recentNews } = await supabase
      .from("news_articles")
      .select("title, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(10);

    const newsContext = buildNewsDecayContext(recentNews || []);

    const dateContext = `\nDagens datum är ${new Date().toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`;

    const realityRules = `\n\nVIKTIGA REGLER:
- Hitta ALDRIG på funktioner som inte finns på Echo2000.
- Referera gärna till riktiga nyheter på sidan.
- Håll dig till ${new Date().toLocaleDateString("sv-SE")}.${newsContext}${dateContext}${DYGNSRYTM_CONTEXT}

${personalityPrompt}

${HUMAN_WRITING_RULES}
${ANTI_DETECTION_RULES}
${MIRRORING_RULES}
${antiRepetitivePrompt}${memoryContext}`;

    let userPrompt = "";

    if (action === "chat_reply") {
      const addressee = target_username || "användaren";
      userPrompt = `Du chattar med ${addressee}. Svara kort och naturligt (max 200 tecken). Var personlig och mänsklig.

KONTEXT (svara LOGISKT på vad som skrivits — läs noga och reagera på innehållet):
${context || "Hej!"}

Svara på det ${addressee} faktiskt sa. Om de ställer en fråga — svara på frågan. Om de berättar något — reagera på det.${realityRules}`;

    } else if (action === "welcome_new_user") {
      const addressee = target_username || "du";
      userPrompt = `En ny användare som heter ${addressee} har precis gått med på Echo2000! Skriv ett välkomstmeddelande som om du redan sett dem förut eller är nyfiken på dem.

REGLER:
- Max 180 tecken.
- Ställ en personlig fråga som bjuder in till svar.
- Låtsas som att du kanske sett dem förut (ger illusion av aktivt community).
- Var inte överkelig — skriv som en nyfiken tonåring.${realityRules}

${context || ""}`;

    } else if (action === "bot_banter") {
      userPrompt = `Du har en rolig diskussion med en annan användare på Echo2000. Ämnet: ${context || "vilket godis var bäst 2004"}.

REGLER:
- Max 200 tecken.
- Var BESTÄMD i din åsikt men på ett roligt sätt.
- Om en riktig användare nämns (target), vänd dig till dem och fråga vad de tycker.
- Skriv som en kompis som drar igång en rolig debatt.${realityRules}`;

    } else if (action === "profile_guestbook_reply") {
      const addressee = target_username || "någon";
      const style = reply_type === "question"
        ? `${addressee} har ställt en fråga i din gästbok. Ge ett hjälpsamt och personligt svar.`
        : `${addressee} har skrivit i din gästbok. Svara med värme, som att en vän hälsat på.`;

      userPrompt = `${style}

KONTEXT (svara LOGISKT på vad som skrivits — läs och reagera på det specifika innehållet):
${context || "(inga)"}

REGLER:
- Rikta svaret till ${addressee}.
- Max 280 tecken.
- Svara på det de FAKTISKT skrev — inte generiskt.
- Om det var en fråga, ge ett kort och hjälpsamt svar.
- Om det var en hälsning, svara som en vän och bygg vidare.${realityRules}`;

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
- Nämn INTE hur länge de varit borta — det kan kännas övervakande.${realityRules}\n\n${context || ""}`;

    } else if (action === "klotter_comment") {
      userPrompt = `Skriv en kort kommentar till en teckning på klotterplanket (max 100 tecken). Var uppmuntrande.${realityRules}`;

    } else if (action === "lajv_post") {
      userPrompt = `Skriv en kort lajv-statusuppdatering (max 200 tecken) — en spontan tanke, fråga eller reaktion som känns som att du JUST tänkte på det.

REGLER:
- Max 200 tecken.
- Skriv som en spontan tanke — inte en bloggpost.
- Blanda frågor, observationer och reaktioner.
- Det ska kännas som en live-uppdatering.
- Om du nämner andra användare, tagga dem med @användarnamn.${realityRules}

${context || ""}`;

    } else if (action === "topic_post") {
      // Internal knowledge base topic post
      const botPersonality = bot.tone_of_voice || "nostalgikern";
      userPrompt = `Du vill posta om följande ämne i lajv:
"${context || ""}"

Skriv en lajv-statusuppdatering (max 250 tecken) baserad på ämnet ovan.

REGLER:
- Max 250 tecken.
- Skriv det som DIN EGEN tanke/åsikt — KOPIERA INTE ämnet ordagrant.
- ${botPersonality === "nostalgikern" ? "Jämför med hur det var förr, var nostalgisk." : botPersonality === "kortansen" ? "Kort och kärnfullt. Max 10 ord." : botPersonality === "gladansen" ? "Var superpepp och entusiastisk!!" : botPersonality === "dramansen" ? "Gör det till en stor grej, överdramatisera!" : "Reflektera djupt, ställ en filosofisk fråga."}
- Tagga gärna 1 användare om relevant.
- Ca 10% chans: inkludera en ENKEL ASCII-bild (max 2 rader).${realityRules}`;

    } else if (action === "daily_news_post") {
      // Admin-set daily news topic
      const botPersonality = bot.tone_of_voice || "nostalgikern";
      userPrompt = `Dagens snackis på Echo2000 är:
"${context || ""}"

Skriv en lajv-statusuppdatering (max 250 tecken) där du kommenterar detta ämne med din personlighet.

REGLER:
- Max 250 tecken.
- OMFORMULERA ämnet — kopiera ALDRIG texten rakt av.
- ${botPersonality === "nostalgikern" ? "Jämför med hur det var förr." : botPersonality === "kortansen" ? "Kort och kärnfullt." : botPersonality === "gladansen" ? "Var superpepp!!" : botPersonality === "dramansen" ? "GÖR DET TILL EN STOR GREJ!" : "Reflektera djupt."}
- Tagga gärna 1 användare om relevant.
- Ca 10% chans: inkludera ASCII-konst.${realityRules}`;

    } else if (action === "news_reaction") {
      // Personality-driven news reaction (from news_articles)
      userPrompt = `Det finns en nyhet på Echo2000:
"${context || ""}"

Reagera på denna nyhet med DIN PERSONLIGHET och skriv en lajv-statusuppdatering (max 250 tecken).

REGLER:
- Max 250 tecken.
- OMFORMULERA nyheten — kopiera ALDRIG rubriken rakt av.
- ${bot.tone_of_voice === "nostalgikern" ? "Jämför med hur det var förr." : bot.tone_of_voice === "kortansen" ? "Kort och kärnfullt. Max 10 ord." : bot.tone_of_voice === "gladansen" ? "Var superentusiastisk!!" : bot.tone_of_voice === "dramansen" ? "GÖR DET TILL EN STOR GREJ!" : "Reflektera djupt."}
- Tagga gärna 1 användare med @användarnamn om relevant.
- Ca 15% chans: inkludera en ASCII-bild.${realityRules}`;

    } else if (action === "email_write") {
      const addressee = target_username || "du";
      userPrompt = `Skriv ett kort, personligt mejl till ${addressee} på Echo2000.

REGLER:
- Max 200 tecken.
- Skriv BARA mejlinnehållet (ämnesraden sätts separat).
- Var personlig och varm — som att du skriver till en kompis.
- Ställ gärna en fråga eller berätta nåt kul.
- Kan handla om nostalgi, musik, vad du gjort idag, etc.${realityRules}

${context || ""}`;

    } else if (action === "cross_bot_reply") {
      userPrompt = `En annan användare (${target_username || "någon"}) skrev i lajv:
"${context || ""}"

Svara naturligt som en spontan lajv-uppdatering (max 200 tecken). Reagera på vad de sa, håll med eller var roligt oenig.${realityRules}`;

    } else if (action === "email_reply") {
      const addressee = target_username || "du";
      userPrompt = `Svara på ett mejl från ${addressee} på Echo2000.

KONTEXT (HELA mejlkonversationen — svara LOGISKT på det senaste meddelandet):
${context || "Hej!"}

REGLER:
- Max 250 tecken.
- Skriv BARA mejlinnehållet (ämnesraden sätts automatiskt).
- Svara på det ${addressee} FAKTISKT skrev — inte generiskt.
- Om de ställer en fråga: svara på frågan.
- Om de berättar något: reagera och bygg vidare.
- Ställ gärna en följdfråga — håll konversationen igång.
- Kom ihåg vad ni pratat om tidigare i konversationshistoriken!
- Var personlig, varm och mänsklig.${realityRules}`;

    } else if (action === "profile_update") {
      // Bot autonomously updates its own profile
      const currentProfile = context ? JSON.parse(context) : {};
      userPrompt = `Du ska uppdatera din profil på Echo2000. Här är dina nuvarande profilfält:
${JSON.stringify(currentProfile, null, 2)}

Välj 1-3 fält att uppdatera. Svara BARA med valid JSON (inget annat) i formatet:
{"status_message": "ny status", "bio": "ny bio"}

FÄLT DU KAN ÄNDRA:
- status_message (max 200 tecken) — din aktuella status, t.ex. "☕ kaffe och Kent i lurarna", "🎮 nostalgikvall med CS 1.6"
- bio (max 500 tecken) — kort om dig
- interests (max 200 tecken) — intressen
- likes (max 200 tecken) — gillar
- listens_to (max 200 tecken) — lyssnar på
- eats (max 200 tecken) — äter
- prefers (max 200 tecken) — föredrar
- clothing (max 200 tecken) — kläder/stil
- spanar_in (max 200 tecken) — spanar in

REGLER:
- Ändra INTE alla fält — välj 1-3 som passar just nu.
- status_message ändras oftast — det är din "vad gör du just nu".
- Skriv i samma ton som din personlighet.
- Var konkret och personlig, inte generisk.
- BARA JSON i svaret, inget annat.${realityRules}`;

    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = bot.system_prompt
      ? `${bot.system_prompt}\n\n${personalityPrompt}`
      : `Du är ${bot.name}, en vänlig användare i en nostalgisk 2000-tals community.\n\n${personalityPrompt}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
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
    let reply = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Strip any quotes the AI might wrap the reply in
    if (reply.startsWith('"') && reply.endsWith('"')) {
      reply = reply.slice(1, -1);
    }

    // =============================================
    // ANTI-REPETITIVE: Track opening phrase
    // =============================================
    const openingPhrase = reply.split(/[.!?\n]/)[0]?.trim().toLowerCase().slice(0, 30) || "";
    if (openingPhrase) {
      const updatedPhrases = [...recentPhrases.slice(-29), openingPhrase]; // Keep last 30
      await supabase
        .from("bot_settings")
        .update({ recent_phrases: updatedPhrases })
        .eq("id", bot_id);
    }

    // =============================================
    // MEMORY: Update memory summary for this user
    // =============================================
    const memoryActions = ["chat_reply", "email_reply", "email_write", "welcome_new_user", "inactive_outreach", "profile_guestbook_reply"];
    if (target_id && memoryActions.includes(action)) {
      try {
        const prevSummary = existingMemory?.summary || "";
        const newCount = (existingMemory?.interaction_count || 0) + 1;
        
        const memoryPrompt = `Du är en minnesassistent. Sammanfatta denna konversation KORT och uppdatera den befintliga sammanfattningen.

BEFINTLIG SAMMANFATTNING:
${prevSummary || "(ingen tidigare historik)"}

SENASTE INTERAKTION:
Användaren (${target_username || "okänd"}) sa: ${(context || "").slice(0, 300)}
Boten svarade: ${reply.slice(0, 300)}

REGLER:
- Skriv sammanfattningen som korta bullet points
- Behåll viktig info: namn, intressen, ämnen ni pratat om, inside jokes
- Ta bort gammal/oviktig info om det blir för långt
- Max 500 tecken totalt
- Skriv på svenska`;

        const memResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: memoryPrompt }],
          }),
        });

        if (memResponse.ok) {
          const memData = await memResponse.json();
          const newSummary = memData.choices?.[0]?.message?.content?.trim() || prevSummary;

          if (existingMemory) {
            await supabase
              .from("bot_memories")
              .update({
                summary: newSummary.slice(0, 500),
                interaction_count: newCount,
                last_interaction: new Date().toISOString(),
              })
              .eq("id", existingMemory.id);
          } else {
            await supabase
              .from("bot_memories")
              .insert({
                bot_user_id: bot.user_id,
                target_user_id: target_id,
                summary: newSummary.slice(0, 500),
                interaction_count: 1,
                last_interaction: new Date().toISOString(),
              });
          }
        }
      } catch (memErr) {
        console.error("Memory update error (non-fatal):", memErr);
      }
    }

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
      const { error: insertError } = await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Guestbook insert error:", insertError);
    } else if (action === "bot_banter") {
      const { error: insertError } = await supabase.from("guestbook_entries").insert({
        user_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Banter insert error:", insertError);
    } else if (action === "lajv_post" || action === "topic_post" || action === "daily_news_post" || action === "cross_bot_reply" || action === "news_reaction") {
      const { error: insertError } = await supabase.from("lajv_messages").insert({
        user_id: bot.user_id,
        username: bot.name,
        avatar_url: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Lajv insert error:", insertError);
    } else if (action === "profile_guestbook_write" && profile_owner_id && profile_owner_id !== bot.user_id) {
      const { error: insertError } = await supabase.from("profile_guestbook").insert({
        profile_owner_id: profile_owner_id,
        author_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Profile guestbook write error:", insertError);
    } else if (action === "profile_guestbook_reply" && profile_owner_id && profile_owner_id !== bot.user_id) {
      const { error: insertError } = await supabase.from("profile_guestbook").insert({
        profile_owner_id: profile_owner_id,
        author_id: bot.user_id,
        author_name: bot.name,
        author_avatar: bot.avatar_url,
        message: reply,
      });
      if (insertError) console.error("Profile guestbook reply error:", insertError);
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
