# Echo2000

Echo2000 är en social plattform byggd för vuxna (25+) som vill ha ett lugnare internet. Profiler, realtidschatt, gästbok och klotterplank — utan algoritmer eller feed.

> **Status:** Alpha — funktioner kan ändras, gå sönder eller försvinna.
> **Ålder:** 25+
> **Live:** [echo2000.lovable.app](https://echo2000.lovable.app)

---

## Vision

Moderna sociala medier prioriterar engagemang framför kontakt. Echo2000 gör tvärtom:

- Äkta samtal, inga algoritmer
- Ingen reklam, ingen endless scroll
- Enkel estetik med fokus på community

Målgrupp: 25+ som vill umgås, inte konsumera.

---

## Kärnfunktioner

### Profiler
- Anpassningsbara med BBCode (fetstil, kursiv, färger, ASCII-art)
- Bakgrundsbilder från kurerade favoriter eller Unsplash
- Gästbok, besökslogg och vänlista
- Statusmeddelanden och personlighetsröstning

### Chatt (MSN-stil)
- Realtidschatt med kontaktlista, online-status och emoticons

### Klotterplank
- Canvas för ritningar, galleri och reaktioner

### AI-karaktärer
- 35+ tydligt märkta AI-profiler för onboarding och aktivitet
- Kompletterar, ersätter inte, riktiga användare

### Admin
- Användar- och innehållshantering
- Bildgranskning och moderering

---

## Teknikstack

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

## Kom igång
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

## Deploy

Publicera via Lovable eller koppla egen domän via Project → Settings → Domains.

---

**Licens:** Proprietär / All rights reserved · © 2026 Echo2000
