import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 35 unique bot profiles with 2000s Swedish nostalgia names
const BOT_PROFILES = [
  { username: "Sk8erBoi", city: "Göteborg", gender: "Kille", bio: "kickflips o punk, blink-182 fan sen 02", status_message: "sk8 or die lol" },
  { username: "PopPrinsessan", city: "Stockholm", gender: "Tjej", bio: "musik, mode o msn <3", status_message: "lyssnar på robyn" },
  { username: "Lunar_Kansen", city: "Malmö", gender: "Kille", bio: "OG lunar-user sedan 2003", status_message: "nostalgi trip" },
  { username: "Blink_Girl91", city: "Uppsala", gender: "Tjej", bio: "punkrock o eyeliner", status_message: "all the small things~" },
  { username: "Znooze_Fezt", city: "Linköping", gender: "Kille", bio: "sover helst.. men csn e bra", status_message: "zzz" },
  { username: "xXDarkAngelXx", city: "Örebro", gender: "Tjej", bio: "evanescence 4ever", status_message: "wake me up inside" },
  { username: "CS_Kansen", city: "Västerås", gender: "Kille", bio: "dust2 varje kväll", status_message: "headshot!" },
  { username: "GlitterTjejen", city: "Umeå", gender: "Tjej", bio: "rosa, glitter o lip gloss", status_message: "shopping <3" },
  { username: "SnakeKing", city: "Jönköping", gender: "Kille", bio: "ormen på nokia = livet", status_message: "nytt rekord!!" },
  { username: "MSN_Queen", city: "Lund", gender: "Tjej", bio: "bästa msn-nicket 2004", status_message: "*~LiVeT e BeAuTiFuL~*" },
  { username: "Emansen03", city: "Norrköping", gender: "Kille", bio: "hiphop o skateboard", status_message: "slim shady lp på repeat" },
  { username: "Kexchokladansen", city: "Helsingborg", gender: "Kille", bio: "godis > allt", status_message: "mums" },
  { username: "ZTV_Ansen", city: "Karlstad", gender: "Kille", bio: "musikvideos dygnet runt", status_message: "ztv var bättre" },
  { username: "BloggDansen", city: "Gävle", gender: "Tjej", bio: "blogg.se veteran", status_message: "nytt inlägg!!" },
  { username: "RuneScapeansen", city: "Sundsvall", gender: "Kille", bio: "mining lvl 99", status_message: "buying gf 10k" },
  { username: "Habboansen", city: "Borås", gender: "Kille", bio: "habbo hotell regular", status_message: "bobba" },
  { username: "IdolFansen", city: "Växjö", gender: "Tjej", bio: "idol VARJE fredag!!", status_message: "rösta rösta rösta" },
  { username: "PetterFansen", city: "Göteborg", gender: "Kille", bio: "mikrofonkåt på repeat", status_message: "hip hop hooray" },
  { username: "Kentansen", city: "Eskilstuna", gender: "Kille", bio: "kent e livet tbh", status_message: "mannen i den vita hatten" },
  { username: "Napsteransen", city: "Halmstad", gender: "Kille", bio: "laddar ner allt", status_message: "56k modem vibes" },
  { username: "JoltColansen", city: "Trollhättan", gender: "Kille", bio: "jolt cola o LAN", status_message: "KOFFEIN" },
  { username: "OC_Fansen", city: "Kalmar", gender: "Tjej", bio: "seth cohen <3 <3 <3", status_message: "califoooornia" },
  { username: "LimeWiransen", city: "Falun", gender: "Kille", bio: "virus? värt det för musiken", status_message: "downloading..." },
  { username: "Pistvansen", city: "Östersund", gender: "Kille", bio: "pistvakt bästa serien", status_message: "haha klassiker" },
  { username: "SmsTjejen", city: "Nyköping", gender: "Tjej", bio: "10 sms om dan typ", status_message: "pip pip" },
  { username: "TechnoPansen", city: "Kiruna", gender: "Kille", bio: "basshunter o scooter", status_message: "boots n cats" },
  { username: "Millencolansen", city: "Örebro", gender: "Kille", bio: "pennybridge pioneers!", status_message: "no cigar!" },
  { username: "HippieChansen", city: "Visby", gender: "Tjej", bio: "fred o kärlek o lunarstorm", status_message: "peace <3" },
  { username: "MP3ansen", city: "Luleå", gender: "Kille", bio: "min mp3-spelare har 256mb lol", status_message: "shuffle mode" },
  { username: "SethCohenansen", city: "Kristianstad", gender: "Kille", bio: "nörd men cool typ", status_message: "death cab <3" },
  { username: "ICQ_Tansen", city: "Skövde", gender: "Kille", bio: "uh oh! minns ni ljudet?", status_message: "online" },
  { username: "Neroansen", city: "Landskrona", gender: "Kille", bio: "brände 500 cd-skivor 2004", status_message: "nero burning rom" },
  { username: "RobynFansen", city: "Stockholm", gender: "Tjej", bio: "show me love var min jam", status_message: "dans dans" },
  { username: "ExpeditionFansen", city: "Sundsvall", gender: "Tjej", bio: "robinson > allt på tv", status_message: "vem åker ut??" },
  { username: "WiFansen", city: "Mora", gender: "Kille", bio: "wii sports champion 06", status_message: "strike!" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const token = authHeader.replace("Bearer ", "");

  const isServiceRole = token === serviceRoleKey;
  
  // For non-service-role callers, verify JWT and admin role
  if (!isServiceRole) {
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { action } = await req.json();

    if (action === "spawn_bots") {
      return await spawnBots(supabase, corsHeaders);
    } else if (action === "update_presence") {
      return await updateBotPresence(supabase, corsHeaders);
    } else if (action === "exorcism") {
      return await exorcism(supabase, corsHeaders);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("bot-manager error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function spawnBots(supabase: ReturnType<typeof createClient>, headers: Record<string, string>) {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const bot of BOT_PROFILES) {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", bot.username)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped.push(bot.username);
      continue;
    }

    // Create auth user for the bot
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    const email = `${bot.username.toLowerCase().replace(/[^a-z0-9]/g, "")}@echo2000.bot`;
    const password = crypto.randomUUID();

    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: bot.username },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error(`Failed to create bot user ${bot.username}:`, errText);
      skipped.push(bot.username);
      continue;
    }

    const userData = await createRes.json();
    const userId = userData.id;

    // Update the profile to mark as bot with full data
    const now = new Date().toISOString();
    await supabase.from("profiles").update({
      is_bot: true,
      is_approved: true,
      city: bot.city,
      gender: bot.gender,
      bio: bot.bio,
      status_message: bot.status_message,
      last_seen: now,
    } as any).eq("user_id", userId);

    // Create bot_settings entry
    await supabase.from("bot_settings").insert({
      user_id: userId,
      name: bot.username,
      system_prompt: `Du heter ${bot.username} och är en svensk tonåring (ca 15-19 år) från ${bot.city}. Din personlighet: ${bot.bio}. Skriv alltid som en riktig person från 2004 — med slang, stavfel och spontanitet.`,
      activity_level: 30 + Math.floor(Math.random() * 40),
      is_active: true,
      allowed_contexts: ["chat", "guestbook"],
      cron_interval: "*/15 * * * *",
    });

    created.push(bot.username);
  }

  return new Response(JSON.stringify({ 
    success: true, 
    created: created.length, 
    skipped: skipped.length,
    created_names: created,
    skipped_names: skipped,
  }), { headers: { ...headers, "Content-Type": "application/json" } });
}

async function updateBotPresence(supabase: ReturnType<typeof createClient>, headers: Record<string, string>) {
  // Get all bot profiles
  const { data: botProfiles } = await supabase
    .from("profiles")
    .select("user_id, username")
    .eq("is_bot", true);

  if (!botProfiles || botProfiles.length === 0) {
    return new Response(JSON.stringify({ updated: 0 }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Randomly pick 40-80% of bots to be "online" (vary each run)
  const onlineRatio = 0.4 + Math.random() * 0.4;
  const shuffled = [...botProfiles].sort(() => Math.random() - 0.5);
  const onlineBots = shuffled.slice(0, Math.ceil(shuffled.length * onlineRatio));

  const now = new Date().toISOString();
  let updated = 0;

  for (const bot of onlineBots) {
    await supabase.from("profiles").update({ last_seen: now } as any).eq("user_id", bot.user_id);
    updated++;
  }

  return new Response(JSON.stringify({ success: true, updated, total: botProfiles.length }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function exorcism(supabase: ReturnType<typeof createClient>, headers: Record<string, string>) {
  // Get all bot user_ids
  const { data: botProfiles } = await supabase
    .from("profiles")
    .select("user_id, username")
    .eq("is_bot", true);

  if (!botProfiles || botProfiles.length === 0) {
    return new Response(JSON.stringify({ deleted: 0, message: "No bots found" }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const botUserIds = botProfiles.map(b => b.user_id);
  let deleted = 0;

  for (const userId of botUserIds) {
    // Delete bot_settings
    await supabase.from("bot_settings").delete().eq("user_id", userId);

    // Delete all related data (same cascade as admin delete)
    await supabase.from("guestbook_entries").delete().eq("user_id", userId);
    await supabase.from("profile_guestbook").delete().or(`author_id.eq.${userId},profile_owner_id.eq.${userId}`);
    await supabase.from("chat_messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    await supabase.from("friends").delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`);
    await supabase.from("friend_votes").delete().or(`voter_id.eq.${userId},target_user_id.eq.${userId}`);
    await supabase.from("good_vibes").delete().eq("giver_id", userId);
    await supabase.from("lajv_messages").delete().eq("user_id", userId);
    await supabase.from("profile_visits").delete().or(`visitor_id.eq.${userId},profile_owner_id.eq.${userId}`);
    await supabase.from("messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    await supabase.from("user_roles").delete().eq("user_id", userId);
    
    // Delete profile
    await supabase.from("profiles").delete().eq("user_id", userId);

    // Delete auth user
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    deleted++;
  }

  return new Response(JSON.stringify({ success: true, deleted, names: botProfiles.map(b => b.username) }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
