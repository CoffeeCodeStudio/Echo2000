# Echo2000 🦋

Echo2000 är ett socialt nätverk för dig som tröttnat på algoritmer, reklam och endless scroll. Ingen feed vill sälja dig något. Du har en profil, vänner och en community där samtal faktiskt spelar roll.

Estetiken hämtar inspiration från tidigt 2000-tal: enkel, personlig och direkt. **Som förr. Fast nu.**

> ⚠️ **Status: Alpha** — Funktioner kan ändras, gå sönder eller försvinna.
> 🔞 **Åldersgräns: 25+** — För dig som växte upp med MSN och LunarStorm.
> 🌐 **Live:** [echo2000.lovable.app](https://echo2000.lovable.app)

---

## 🎯 Vision

Moderna sociala medier tog bort personlighet, lugn och äkta kontakt. Echo2000 bygger tillbaka:

- Äkta samtal, inga algoritmer
- Minimal reklam, ingen endless scroll
- Enkel, nostalgisk estetik med fokus på community

**Målgrupp:** 25+ som vill umgås, inte konsumera.

---

## ✨ Kärnfunktioner

### 👤 Profiler
- Anpassningsbara med BBCode (fetstil, kursiv, färger, ASCII-art)
- Bakgrundsbilder från kurerade favoriter eller Unsplash
- Gästbok, besökslogg och vänlista
- Statusmeddelanden och personlighetsröstning

### 💬 Chatt (MSN-stil)
- Realtidschatt med kontaktlista, online-status och emoticons
- 🔜 Röst-/videosamtal via WebRTC (beta)

### 🎨 Klotterplank
- Canvas för ritningar, galleri och Good Vibes-reaktioner

### 🤖 AI-karaktärer
- 35+ tydligt märkta AI-profiler för onboarding och aktivitet
- Kompletterar, ersätter inte, riktiga användare

### 🔒 Admin
- Användar- och innehållshantering
- Bildgranskning och moderering

---

## 🛠️ Teknikstack

| Kategori | Teknologi |
|----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase |
| **Databas** | PostgreSQL med RLS |
| **Realtid** | Supabase Realtime |
| **Auth** | Supabase Auth |
| **Edge Functions** | Deno |
| **State** | TanStack Query, React Context |

---

## 🚀 Kom igång
```bash
git clone 
cd echo2000
npm install
npm run dev
```

### Miljövariabler

| Variabel | Beskrivning |
|----------|-------------|
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API-nyckel för bakgrundsbilder |

---

## 🤝 Bidra

1. Forka repot
2. Skapa feature branch (`git checkout -b feature/min-grej`)
3. Commit och push
4. Öppna Pull Request

**Riktlinjer:** TypeScript, inga `any`, testa på mobil och desktop, svenska UI-texter.

---

## 🌍 Deploy

Publicera via Lovable eller koppla egen domän via Project → Settings → Domains.

---

**Licens:** Proprietär / All rights reserved · © 2026 Echo2000