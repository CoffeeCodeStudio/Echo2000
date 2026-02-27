import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// 35 unique bot profiles with 2000s Swedish nostalgia – fully fleshed out
const BOT_PROFILES = [
  { username: "Sk8erBoi", city: "Göteborg", gender: "Kille", age: 17, bio: "kickflips o punk, blink-182 fan sen 02", status_message: "sk8 or die lol", occupation: "Skateboardåkare", personality: "Chill", hair_color: "Blond", body_type: "Smal", clothing: "Baggy jeans o Vans", likes: "Skateparker, punk, pizza", eats: "Pizza o energidryck", listens_to: "Blink-182, Sum 41, Green Day", prefers: "Utomhus", interests: "Skateboard, graffiti, musik", spanar_in: "Tjejer som gillar punk", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face" },
  { username: "PopPrinsessan", city: "Stockholm", gender: "Tjej", age: 16, bio: "musik, mode o msn <3", status_message: "lyssnar på robyn", occupation: "Elev", personality: "Social", hair_color: "Brunett", body_type: "Normal", clothing: "Rosa hoodie o lågmidjade jeans", likes: "Shopping, sminkning, dans", eats: "Sushi o smoothies", listens_to: "Robyn, Britney, Christina Aguilera", prefers: "Stadsliv", interests: "Mode, musik, blogga", spanar_in: "Söta killar med humor", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face" },
  { username: "Lunar_Kansen", city: "Malmö", gender: "Kille", age: 18, bio: "OG lunar-user sedan 2003", status_message: "nostalgi trip", occupation: "Webbutvecklare", personality: "Nördig", hair_color: "Svart", body_type: "Normal", clothing: "Band-tröja o cargo", likes: "Teknik, retro-spel, forum", eats: "Nudlar o cola", listens_to: "Kent, Radiohead", prefers: "Internet", interests: "Webdesign, fotografi, gaming", spanar_in: "Smarta tjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" },
  { username: "Blink_Girl91", city: "Uppsala", gender: "Tjej", age: 15, bio: "punkrock o eyeliner", status_message: "all the small things~", occupation: "Elev", personality: "Rebellisk", hair_color: "Svart med rosa slingor", body_type: "Smal", clothing: "Svart t-shirt o Converse", likes: "Konserter, rita, skriva dikter", eats: "Veganskt", listens_to: "Blink-182, Paramore, MCR", prefers: "Livescener", interests: "Musik, konst, poesi", spanar_in: "Emo-killar", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face" },
  { username: "Znooze_Fezt", city: "Linköping", gender: "Kille", age: 19, bio: "sover helst.. men csn e bra", status_message: "zzz", occupation: "Student", personality: "Lat men smart", hair_color: "Brun", body_type: "Normal", clothing: "Mjukisbyxor 24/7", likes: "Sova, Netflix, snacks", eats: "Allt som levereras", listens_to: "Lo-fi hip hop", prefers: "Sängen", interests: "Sova, filosofi, memes", spanar_in: "Lugna tjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face" },
  { username: "xXDarkAngelXx", city: "Örebro", gender: "Tjej", age: 16, bio: "evanescence 4ever", status_message: "wake me up inside", occupation: "Elev", personality: "Mystisk", hair_color: "Svart", body_type: "Smal", clothing: "Svart klänning o nitar", likes: "Vampyrböcker, nattpromenader", eats: "Choklad", listens_to: "Evanescence, Nightwish, Within Temptation", prefers: "Mörker", interests: "Skriva, gothic konst, tarot", spanar_in: "Mörka själar", relationship: "Komplicerat", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face" },
  { username: "CS_Kansen", city: "Västerås", gender: "Kille", age: 17, bio: "dust2 varje kväll", status_message: "headshot!", occupation: "Elev", personality: "Tävlingsinriktad", hair_color: "Ljusbrun", body_type: "Normal", clothing: "Gaming-hoodie", likes: "CS, LAN, pizza", eats: "Pizza o Jolt Cola", listens_to: "Basshunter, Scooter", prefers: "Framför datorn", interests: "Gaming, streama, bygga datorer", spanar_in: "Gamer-tjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face" },
  { username: "GlitterTjejen", city: "Umeå", gender: "Tjej", age: 15, bio: "rosa, glitter o lip gloss", status_message: "shopping <3", occupation: "Elev", personality: "Glad", hair_color: "Blond", body_type: "Normal", clothing: "Glittrig topp o kjol", likes: "Shopping, smink, hästar", eats: "Godis o glass", listens_to: "Avril Lavigne, Hilary Duff", prefers: "Köpcentrum", interests: "Mode, hästar, dans", spanar_in: "Snygga killar", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face" },
  { username: "SnakeKing", city: "Jönköping", gender: "Kille", age: 16, bio: "ormen på nokia = livet", status_message: "nytt rekord!!", occupation: "Elev", personality: "Besatt", hair_color: "Röd", body_type: "Normal", clothing: "Jeans o t-shirt", likes: "Mobilspel, rekordjakt", eats: "Godis", listens_to: "Crazy Frog, Basshunter", prefers: "Mobilen", interests: "Snake, retro-spel, programmering", spanar_in: "Tjejer som fattar spel", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face" },
  { username: "MSN_Queen", city: "Lund", gender: "Tjej", age: 17, bio: "bästa msn-nicket 2004", status_message: "*~LiVeT e BeAuTiFuL~*", occupation: "Elev", personality: "Dramatisk", hair_color: "Blond med slingor", body_type: "Normal", clothing: "Lågmidjade jeans o linne", likes: "MSN, blogga, fotoalbum", eats: "Sallad o bubbelte", listens_to: "Destiny's Child, Spice Girls", prefers: "Online", interests: "Chatta, fotografi, dagbok", spanar_in: "Roliga killar", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face" },
  { username: "Emansen03", city: "Norrköping", gender: "Kille", age: 18, bio: "hiphop o skateboard", status_message: "slim shady lp på repeat", occupation: "Rappare", personality: "Cool", hair_color: "Blond (blekt)", body_type: "Atletisk", clothing: "Oversized hoodie o cap", likes: "Freestyle, beatboxing", eats: "Hamburgare", listens_to: "Eminem, 50 Cent, Petter", prefers: "Studio", interests: "Rap, skateboard, graffiti", spanar_in: "Tjejer med attityd", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=200&h=200&fit=crop&crop=face" },
  { username: "Kexchokladansen", city: "Helsingborg", gender: "Kille", age: 15, bio: "godis > allt", status_message: "mums", occupation: "Elev", personality: "Rolig", hair_color: "Brun", body_type: "Normal", clothing: "Tröja med tryck", likes: "Godis, TV-spel, kompisar", eats: "Kexchoklad, lösgodis", listens_to: "Markoolio, Dr. Bombay", prefers: "Godishyllan", interests: "Samla på godis, gaming", spanar_in: "Alla som bjuder på godis", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face" },
  { username: "ZTV_Ansen", city: "Karlstad", gender: "Kille", age: 19, bio: "musikvideos dygnet runt", status_message: "ztv var bättre", occupation: "Musikjournalist", personality: "Nostalgisk", hair_color: "Svart", body_type: "Smal", clothing: "Vintage band-tröja", likes: "Musikvideos, vinyl, konserter", eats: "Toast", listens_to: "Allt på ZTV", prefers: "Framför TVn", interests: "Musik, film, recensioner", spanar_in: "Musiknördar", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face" },
  { username: "BloggDansen", city: "Gävle", gender: "Tjej", age: 16, bio: "blogg.se veteran", status_message: "nytt inlägg!!", occupation: "Bloggare", personality: "Kreativ", hair_color: "Röd", body_type: "Normal", clothing: "Trendig", likes: "Blogga, fota, skriva", eats: "Kaffe o kanelbullar", listens_to: "The Cardigans, Robyn", prefers: "Kaféer", interests: "Skrivande, fotografi, mode", spanar_in: "Kreativa killar", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face" },
  { username: "RuneScapeansen", city: "Sundsvall", gender: "Kille", age: 16, bio: "mining lvl 99", status_message: "buying gf 10k", occupation: "Elev", personality: "Dedikerad", hair_color: "Brun", body_type: "Normal", clothing: "Gaming-tröja", likes: "RuneScape, WoW, fantasy", eats: "Chips o läsk", listens_to: "RuneScape OST", prefers: "Gielinor", interests: "MMORPG, fantasy, medeltiden", spanar_in: "Gamer-tjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=200&h=200&fit=crop&crop=face" },
  { username: "Habboansen", city: "Borås", gender: "Kille", age: 15, bio: "habbo hotell regular", status_message: "bobba", occupation: "Elev", personality: "Social", hair_color: "Blond", body_type: "Normal", clothing: "Sportkläder", likes: "Habbo, bygga rum, festa", eats: "Korv o bröd", listens_to: "Basshunter", prefers: "Habbo Hotel", interests: "Habbo, inredning, kompisar", spanar_in: "Tjejer på Habbo", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face" },
  { username: "IdolFansen", city: "Växjö", gender: "Tjej", age: 17, bio: "idol VARJE fredag!!", status_message: "rösta rösta rösta", occupation: "Elev", personality: "Entusiastisk", hair_color: "Brunett", body_type: "Normal", clothing: "Glittrig topp", likes: "Idol, sjunga, karaoke", eats: "Popcorn", listens_to: "Idol-vinnare, Agnes, Danny", prefers: "Framför TVn på fredagar", interests: "Sång, dans, reality-TV", spanar_in: "Idol-deltagare", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face" },
  { username: "PetterFansen", city: "Göteborg", gender: "Kille", age: 18, bio: "mikrofonkåt på repeat", status_message: "hip hop hooray", occupation: "DJ", personality: "Energisk", hair_color: "Rakat", body_type: "Atletisk", clothing: "Streetwear", likes: "Hip hop, breakdance, graffiti", eats: "Kebab", listens_to: "Petter, Timbuktu, Looptroop", prefers: "Klubbar", interests: "Musik, breakdance, DJ:a", spanar_in: "Tjejer som dansar", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=200&h=200&fit=crop&crop=face" },
  { username: "Kentansen", city: "Eskilstuna", gender: "Kille", age: 19, bio: "kent e livet tbh", status_message: "mannen i den vita hatten", occupation: "Poet", personality: "Melankolisk", hair_color: "Mörkbrun", body_type: "Smal", clothing: "Skinnjacka", likes: "Kent, poesi, ensamma promenader", eats: "Kaffe o mackor", listens_to: "Kent, Bob Hund, Håkan Hellström", prefers: "Regn", interests: "Skriva, läsa, filosofera", spanar_in: "Djupa själar", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&h=200&fit=crop&crop=face" },
  { username: "Napsteransen", city: "Halmstad", gender: "Kille", age: 17, bio: "laddar ner allt", status_message: "56k modem vibes", occupation: "Elev", personality: "Pirat", hair_color: "Blond", body_type: "Normal", clothing: "T-shirt med nördig text", likes: "Ladda ner musik, bränna CD", eats: "Chips", listens_to: "Allt som finns på Napster", prefers: "Datorn kl 02 på natten", interests: "P2P, teknik, musik", spanar_in: "Nördar", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&h=200&fit=crop&crop=face" },
  { username: "JoltColansen", city: "Trollhättan", gender: "Kille", age: 16, bio: "jolt cola o LAN", status_message: "KOFFEIN", occupation: "Elev", personality: "Hyperaktiv", hair_color: "Rödbrun", body_type: "Smal", clothing: "LAN-tröja", likes: "LAN, energidryck, nattspelande", eats: "Chips, Jolt Cola, godis", listens_to: "Scooter, Basshunter, Vengaboys", prefers: "LAN-party", interests: "Gaming, bygga datorer, LAN", spanar_in: "Tjejer som pallar LAN", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=face" },
  { username: "OC_Fansen", city: "Kalmar", gender: "Tjej", age: 17, bio: "seth cohen <3 <3 <3", status_message: "califoooornia", occupation: "Elev", personality: "Romantisk", hair_color: "Brunett", body_type: "Normal", clothing: "Strandkläder-chic", likes: "The OC, romantik, stranden", eats: "Frozen yoghurt", listens_to: "Death Cab, The Killers, Phantom Planet", prefers: "Stranden", interests: "TV-serier, mode, drömma", spanar_in: "Seth Cohen-typer", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&h=200&fit=crop&crop=face" },
  { username: "LimeWiransen", city: "Falun", gender: "Kille", age: 18, bio: "virus? värt det för musiken", status_message: "downloading...", occupation: "Elev", personality: "Risktagare", hair_color: "Svart", body_type: "Normal", clothing: "Sliten hoodie", likes: "Musik, datorer, fildela", eats: "Snabbnudlar", listens_to: "Allt blandat", prefers: "Natt", interests: "Teknik, musik, datorer", spanar_in: "Tech-tjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&h=200&fit=crop&crop=face" },
  { username: "Pistvansen", city: "Östersund", gender: "Kille", age: 19, bio: "pistvakt bästa serien", status_message: "haha klassiker", occupation: "Skidlärare", personality: "Rolig", hair_color: "Ljusbrun", body_type: "Atletisk", clothing: "Skidkläder", likes: "Skidåkning, humor, öl", eats: "Korv o mos", listens_to: "Kent, Håkan Hellström", prefers: "Fjällen", interests: "Skidåkning, humor, fest", spanar_in: "Afterski-tjejer", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face" },
  { username: "SmsTjejen", city: "Nyköping", gender: "Tjej", age: 15, bio: "10 sms om dan typ", status_message: "pip pip", occupation: "Elev", personality: "Pratglad", hair_color: "Ljusbrun", body_type: "Normal", clothing: "Jeans o söt topp", likes: "SMS:a, prata i telefon, kompisar", eats: "Glass", listens_to: "A*Teens, t.A.T.u.", prefers: "Telefonen", interests: "Chatta, vänner, mode", spanar_in: "Killar som svarar snabbt", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face" },
  { username: "TechnoPansen", city: "Kiruna", gender: "Kille", age: 18, bio: "basshunter o scooter", status_message: "boots n cats", occupation: "DJ", personality: "Energisk", hair_color: "Blond", body_type: "Normal", clothing: "Rave-kläder", likes: "Techno, rave, dans", eats: "Energibars", listens_to: "Basshunter, Scooter, Darude", prefers: "Klubben", interests: "DJ:a, producera musik, festa", spanar_in: "Rave-tjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=200&h=200&fit=crop&crop=face" },
  { username: "Millencolansen", city: "Örebro", gender: "Kille", age: 17, bio: "pennybridge pioneers!", status_message: "no cigar!", occupation: "Elev", personality: "Punkig", hair_color: "Svart med blå toppar", body_type: "Smal", clothing: "Punkväst o Docs", likes: "Punk, konserter, skejta", eats: "Tacos", listens_to: "Millencolin, NOFX, Bad Religion", prefers: "Skatepark", interests: "Punk, skateboard, DIY", spanar_in: "Punkbrudar", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1514222709107-a180c68d72b4?w=200&h=200&fit=crop&crop=face" },
  { username: "HippieChansen", city: "Visby", gender: "Tjej", age: 18, bio: "fred o kärlek o lunarstorm", status_message: "peace <3", occupation: "Konstnär", personality: "Fridful", hair_color: "Ljusbrun med flätor", body_type: "Normal", clothing: "Lång kjol o blommor", likes: "Yoga, natur, konst", eats: "Ekologiskt", listens_to: "Bob Marley, Jack Johnson", prefers: "Naturen", interests: "Konst, meditation, resor", spanar_in: "Fria själar", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=200&h=200&fit=crop&crop=face" },
  { username: "MP3ansen", city: "Luleå", gender: "Kille", age: 16, bio: "min mp3-spelare har 256mb lol", status_message: "shuffle mode", occupation: "Elev", personality: "Tekniknörd", hair_color: "Brun", body_type: "Normal", clothing: "Hörlurar + hoodie", likes: "MP3-spelare, musik, teknik", eats: "Mackor", listens_to: "Allt som får plats på 256mb", prefers: "Bussen med musik", interests: "Teknik, musik, gadgets", spanar_in: "Musikälskare", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face&q=80&sat=-20" },
  { username: "SethCohenansen", city: "Kristianstad", gender: "Kille", age: 17, bio: "nörd men cool typ", status_message: "death cab <3", occupation: "Elev", personality: "Charmig nörd", hair_color: "Mörk lockig", body_type: "Smal", clothing: "Polo o chinos", likes: "Serietidningar, indie-musik, sarkasm", eats: "Bagels", listens_to: "Death Cab for Cutie, The Shins", prefers: "Soffan med serietidningar", interests: "Serier, musik, film", spanar_in: "Summer Roberts-typer", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1484515991647-c5760fcecfc7?w=200&h=200&fit=crop&crop=face" },
  { username: "ICQ_Tansen", city: "Skövde", gender: "Kille", age: 19, bio: "uh oh! minns ni ljudet?", status_message: "online", occupation: "IT-support", personality: "Nostalgisk", hair_color: "Brun", body_type: "Normal", clothing: "Polo-tröja", likes: "ICQ, IRC, nostalgi", eats: "Pizza", listens_to: "90-talspop", prefers: "Retro-internet", interests: "Nostalgi, teknikhistoria, forum", spanar_in: "90-talstjejer", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop&crop=face" },
  { username: "Neroansen", city: "Landskrona", gender: "Kille", age: 18, bio: "brände 500 cd-skivor 2004", status_message: "nero burning rom", occupation: "Elev", personality: "Samlare", hair_color: "Blond", body_type: "Normal", clothing: "Vanlig t-shirt", likes: "Bränna CD, samla musik", eats: "Chips o dipp", listens_to: "Mix-CDs", prefers: "Datorn", interests: "Musik, samlande, teknik", spanar_in: "Tjejer med bra musiksmak", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=face" },
  { username: "RobynFansen", city: "Stockholm", gender: "Tjej", age: 17, bio: "show me love var min jam", status_message: "dans dans", occupation: "Dansare", personality: "Energisk", hair_color: "Kort blond", body_type: "Atletisk", clothing: "Sportig chic", likes: "Dansa, sjunga, träna", eats: "Frukt o smoothies", listens_to: "Robyn, Madonna, Kylie", prefers: "Dansgolvet", interests: "Dans, musik, fitness", spanar_in: "Killar som kan dansa", relationship: "Singel", looking_for: ["Vänner", "Dejting"], avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face" },
  { username: "ExpeditionFansen", city: "Sundsvall", gender: "Tjej", age: 18, bio: "robinson > allt på tv", status_message: "vem åker ut??", occupation: "Elev", personality: "Tävlingsinriktad", hair_color: "Brunett", body_type: "Atletisk", clothing: "Sportig", likes: "Reality-TV, äventyr, träna", eats: "Proteinbars", listens_to: "Pop", prefers: "Utomhus", interests: "Äventyr, reality-TV, sport", spanar_in: "Äventyrare", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=200&h=200&fit=crop&crop=face" },
  { username: "WiFansen", city: "Mora", gender: "Kille", age: 15, bio: "wii sports champion 06", status_message: "strike!", occupation: "Elev", personality: "Lekfull", hair_color: "Ljusbrun", body_type: "Normal", clothing: "Sportig", likes: "Wii, sport, kompisar", eats: "Pannkakor", listens_to: "Wii-musiken", prefers: "Vardagsrummet", interests: "Konsolspel, sport, umgås", spanar_in: "Tjejer som spelar Wii", relationship: "Singel", looking_for: ["Vänner"], avatar_url: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=200&h=200&fit=crop&crop=face" },
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
      age: bot.age,
      bio: bot.bio,
      status_message: bot.status_message,
      occupation: bot.occupation,
      personality: bot.personality,
      hair_color: bot.hair_color,
      body_type: bot.body_type,
      clothing: bot.clothing,
      likes: bot.likes,
      eats: bot.eats,
      listens_to: bot.listens_to,
      prefers: bot.prefers,
      interests: bot.interests,
      spanar_in: bot.spanar_in,
      relationship: bot.relationship,
      looking_for: bot.looking_for,
      avatar_url: bot.avatar_url,
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
  const orFilter = botUserIds.map(id => `user_id.eq.${id}`).join(",");
  const orFilterSender = botUserIds.map(id => `sender_id.eq.${id}`).join(",");
  const orFilterAuthor = botUserIds.map(id => `author_id.eq.${id}`).join(",");
  const orFilterVisitor = botUserIds.map(id => `visitor_id.eq.${id}`).join(",");
  const orFilterVoter = botUserIds.map(id => `voter_id.eq.${id}`).join(",");
  const orFilterGiver = botUserIds.map(id => `giver_id.eq.${id}`).join(",");
  const orFilterFriend = botUserIds.map(id => `friend_id.eq.${id}`).join(",");
  const orFilterCaller = botUserIds.map(id => `caller_id.eq.${id}`).join(",");
  const orFilterRecipient = botUserIds.map(id => `recipient_id.eq.${id}`).join(",");
  const orFilterOwner = botUserIds.map(id => `profile_owner_id.eq.${id}`).join(",");
  const orFilterTarget = botUserIds.map(id => `target_user_id.eq.${id}`).join(",");

  // Batch delete all related data in parallel
  await Promise.all([
    supabase.from("bot_settings").delete().or(orFilter),
    supabase.from("guestbook_entries").delete().or(orFilter),
    supabase.from("profile_guestbook").delete().or(`${orFilterAuthor},${orFilterOwner}`),
    supabase.from("chat_messages").delete().or(`${orFilterSender},${orFilterRecipient}`),
    supabase.from("friends").delete().or(`${orFilter},${orFilterFriend}`),
    supabase.from("friend_votes").delete().or(`${orFilterVoter},${orFilterTarget}`),
    supabase.from("good_vibes").delete().or(orFilterGiver),
    supabase.from("lajv_messages").delete().or(orFilter),
    supabase.from("profile_visits").delete().or(`${orFilterVisitor},${orFilterOwner}`),
    supabase.from("messages").delete().or(`${orFilterSender},${orFilterRecipient}`),
    supabase.from("user_roles").delete().or(orFilter),
  ]);

  // Delete profiles
  await supabase.from("profiles").delete().eq("is_bot", true);

  // Delete auth users in parallel batches
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  await Promise.all(botUserIds.map(userId =>
    fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${serviceRoleKey}`, apikey: serviceRoleKey },
    })
  ));

  return new Response(JSON.stringify({ success: true, deleted: botProfiles.length, names: botProfiles.map(b => b.username) }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
