# Echo2000 🦋

**Echo2000 är byggt för dig som tröttnat på sociala medier som behandlar dig som en reklamyta.**

> ⚠️ **Status: Alpha** — Projektet är under aktiv utveckling. Funktioner kan ändras, gå sönder eller försvinna utan förvarning.

> 🔞 **Åldersgräns: 25+** — Echo2000 riktar sig till vuxna som växte upp med MSN och LunarStorm. Du måste vara minst 25 år för att skapa ett konto.

🌐 **Live**: [echo2000.lovable.app](https://echo2000.lovable.app)

---

## Om projektet

Här finns inga algoritmer som bestämmer vad du ser. Ingen endless scroll. Ingen reklam. Bara din profil, dina vänner och en community där folk faktiskt pratar med varandra.

Estetiken är inspirerad av tidigt 2000-tal — inte för att vi vill bli barn igen, utan för att den eran hade något som gått förlorat: enkelhet, personlighet och genuint bemötande.

*Som förr. Fast nu.*

## 🎯 Vision

Ett svar på vad sociala medier blev.

Moderna plattformar tog något ifrån oss — personlighet, lugn och äkta kontakt — och ersatte det med algoritmer, reklam och endless scroll. Echo2000 bygger det tillbaka.

**Målgrupp:** 25+ år. Folk som vill ha en plats att faktiskt umgås på — inte konsumera.

## ✨ Funktioner

### 👤 Profiler
- Anpassningsbara profiler med **BBCode-formatering** (fetstil, kursiv, färger, ASCII-art)
- Bakgrundsbilder för presentationen (kurerade favoriter + Unsplash-sökning)
- Profilgästbok, besökslogg och vänlista
- Statusmeddelanden och "Dr. Love"-poäng
- Avatar-uppladdning med moderatorsgranskning

### 💬 Chatt (MSN-stil)
- Realtidschatt med MSN Messenger-inspirerat gränssnitt
- Kontaktlista med online-status
- Emoticons och ljud
- 🔜 Röst-/videosamtal via WebRTC — *Kommer under beta*

### 🎨 Klotterplanket
- Rita och publicera klotter med canvas-verktyg
- Galleri med alla användares konstverk
- Good Vibes-reaktioner

### 🎮 Spel
- 🐍 Snake med topplista
- 🧠 Memory med svårighetsgrader
- ✏️ Scribble (rita-och-gissa) multiplayer

### 📰 Community
- Lajv-ticker (temporära meddelanden)
- Medlemslista med sökfunktion
- Brevlåda (intern post)
- 🔜 Nyhetsredaktion med kommentarer — *Kommer under beta*

### 🤖 AI-karaktärer
**AI-karaktärer** — Tydligt märkta AI-profiler som håller communityn aktiv under uppstartsfasen och hjälper nya användare med onboarding. Ersätter inte riktiga människor — kompletterar dem.

- **35+ AI-karaktärer** med unika personligheter, tonfall och beteenden
- Karaktärerna skriver i gästböcker, svarar i chatten och interagerar med communityn
- Adminpanel för att skapa, konfigurera och hantera karaktärer (aktivitetsnivå, system-prompt, kontext)
- Automatisk cron för periodisk aktivitet

### 🔒 Admin
- Användarhantering (godkännande, roller, bannlysning)
- Bildgranskning för avatarer
- Nyhetshantering och daglig nyhetsticker
- Innehållsmoderering

## 🛠️ Teknikstack

| Kategori | Teknologi |
|----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Lovable Cloud (Supabase) |
| **Databas** | PostgreSQL med RLS |
| **Realtid** | Supabase Realtime |
| **Auth** | Supabase Auth med e-postverifiering |
| **Edge Functions** | Deno (bot-logik, admin-API, radiostream) |
| **State** | TanStack Query, React Context |

## 📁 Projektstruktur

```
src/
├── components/
│   ├── admin/          # Admin-panel (användare, bots, nyheter)
│   ├── auth/           # Inloggning, registrering, onboarding
│   ├── calls/          # WebRTC röst-/videosamtal
│   ├── chat/           # MSN-inspirerad chattfönster
│   ├── friends/        # Vänförfrågningar och vänlista
│   ├── games/          # Snake, Memory, Scribble
│   ├── home/           # Startsida, hero, bento-kort
│   ├── profile/        # Profilredigering, BBCode, bakgrundsväljare
│   ├── settings/       # Kontoinställningar
│   ├── social/         # Gästbok, klotter, lajv, nyheter
│   ├── ui/             # shadcn/ui-komponenter
│   └── HabboRoom/      # Isometriskt rum (Habbo-stil)
├── hooks/              # Custom hooks (auth, profil, chatt, etc.)
├── lib/                # Utilities (BBCode-parser, Unsplash, etc.)
├── contexts/           # React Context (Radio, Lajv)
├── pages/              # Sidkomponenter (Index, Profile, Admin, etc.)
└── integrations/       # Supabase-klient och typer
supabase/
├── functions/          # Edge Functions (admin, bots, radio)
└── config.toml         # Supabase-konfiguration
```

## 🚀 Kom igång

### Krav
- Node.js 18+ (rekommenderat via [nvm](https://github.com/nvm-sh/nvm))

### Installation

```bash
git clone <DIN_GIT_URL>
cd echo2000
npm install
npm run dev
```

### Miljövariabler (valfritt)

| Variabel | Beskrivning |
|----------|-------------|
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API-nyckel för bildsökning i bakgrundsväljaren. Hämta gratis på [unsplash.com/developers](https://unsplash.com/developers) |

## 🤝 Bidra

Projektet är i alpha och vi tar gärna emot hjälp! Så här bidrar du:

1. **Forka** repot
2. Skapa en **feature branch** (`git checkout -b feature/min-grej`)
3. **Commita** dina ändringar (`git commit -m 'Lägg till min grej'`)
4. **Pusha** till din branch (`git push origin feature/min-grej`)
5. Öppna en **Pull Request**

### Riktlinjer
- Skriv TypeScript — inga `any` om det inte är absolut nödvändigt
- Använd befintliga design tokens från `index.css` och `tailwind.config.ts`
- Testa på mobil (390px viewport) och desktop
- Håll komponenter små och fokuserade
- Skriv svenska UI-texter, engelska kodkommentarer

Har du idéer men vill inte koda? Öppna ett **Issue** med din tanke!

## 🌍 Deploy

Öppna projektet i [Lovable](https://lovable.dev/projects/32117feb-2322-4353-ba59-42f9f57d06da) och klicka **Share → Publish**.

### Egen domän

Gå till **Project → Settings → Domains → Connect Domain**.
Mer info: [Custom domain-dokumentation](https://docs.lovable.dev/features/custom-domain)

## 📄 Licens

**Proprietär / All rights reserved** — Se [LICENSE](./LICENSE) för detaljer.

Byggt med [Lovable](https://lovable.dev).
