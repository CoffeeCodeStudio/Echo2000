# Changelog

Alla märkbara ändringar i Echo2000 dokumenteras här.
Formatet följer [Keep a Changelog](https://keepachangelog.com/sv/1.1.0/).

> ⚠️ Projektet är i **Alpha** — versionsnummer följer ännu inte semver strikt.

---

## [0.9.0] — 2026-03-25

### Tillagt
- **Profilsida omdesignad** — Orange header-bar borttagen, användarnamn visas som gradient-titel i profilkortet med redigeringsknapp i övre högra hörnet
- **Presentationsbakgrunder** — Välj bakgrundsbild för presentationen via kurerade favoriter eller Unsplash-sökning
- **BBCode-presentation** — Fullt stöd för [b], [i], [u], [s], [center], [color], [size] och [code] (ASCII-art)
- **Presentationsyta expanderad** — Minst 300px höjd, ingen klippning, naturlig expansion efter innehåll
- **CHANGELOG.md** — Versionshistorik tillagd
- **README uppdaterad** — Alpha-status, 25+ åldersgräns, bidragande-sektion, korrekt botbeskrivning (35+)

### Ändrat
- Profilsidans fliknavigering borttagen — gästbok, vänner och spanare nås via huvudnavbaren istället
- Profilkortet är nu den enda sektionen på profilsidan

### Fixat
- Dubblerade importer i ProfilePage efter refaktorering

---

## [0.8.0] — 2026-03-18

### Tillagt
- **AI-bottar (35 st)** — Unika personligheter, tonfall och beteenden med admin-hantering
- **Bot-cron** — Automatisk periodisk aktivitet för bottar via Edge Functions
- **Bot-manager** — Adminpanel för att skapa, konfigurera och hantera bottar
- **BotAdam** — Automatisk gästboksskrivare vid nya vänskaper

### Ändrat
- Bottar syns i kontaktlista och har online-status via last_seen-fallback

---

## [0.7.0] — 2026-03-10

### Tillagt
- **Scribble** — Rita-och-gissa multiplayer-spel med lobbysystem
- **Snake** — Klassiskt Snake-spel med topplista
- **Memory** — Memoryspel med tre svårighetsgrader och poängsystem
- **Daily Challenge** — Dagliga spelutmaningar

---

## [0.6.0] — 2026-03-01

### Tillagt
- **Klotterplanket** — Canvas-baserat ritverktyg med galleri och Good Vibes-reaktioner
- **Good Vibes-system** — Månadsvis begränsade reaktioner med allowance-hantering
- **Klottergalleri** — Publicera och bläddra bland alla användares konstverk

---

## [0.5.0] — 2026-02-20

### Tillagt
- **WebRTC röst-/videosamtal** — Ring andra användare direkt i chatten
- **Samtalshistorik** — Logg över genomförda samtal
- **Inkommande samtal-dialog** — Popup vid inkommande samtal med acceptera/avvisa

---

## [0.4.0] — 2026-02-10

### Tillagt
- **MSN-chatt** — Realtidschatt med MSN Messenger-inspirerat gränssnitt
- **Kontaktlista** — Online-status, emoticons och nudge-ljud
- **Skrivindikator** — Visa när motparten skriver
- **Brevlåda** — Intern e-post med läs/oläst-markering och stjärnmärkning

---

## [0.3.0] — 2026-02-01

### Tillagt
- **Nyhetsartiklar** — Redaktionella artiklar med kommentarsfält
- **Lajv-ticker** — Temporära meddelanden i realtid
- **Daglig nyhetsticker** — Admin-hanterad nyhetsticker i headern
- **Medlemslista** — Sökbar lista över alla godkända användare

---

## [0.2.0] — 2026-01-20

### Tillagt
- **Profilsystem** — Anpassningsbara profiler med avatar, bio och personlighetsfält
- **Gästbok** — Skriv meddelanden på andras profiler
- **Vänskapssystem** — Skicka och hantera vänförfrågningar med kategorier
- **Besökslogg** — Se vem som spanat in din profil
- **Avatar-uppladdning** — Med moderatorsgranskning innan publicering

---

## [0.1.0] — 2026-01-08

### Tillagt
- **Grundläggande app-struktur** — React 18, TypeScript, Vite, Tailwind CSS
- **Autentisering** — Registrering och inloggning med e-postverifiering
- **Onboarding** — Välkomstmodal för nya användare
- **Admin-panel** — Användarhantering, roller och godkännanden
- **Retro CRT-design** — Nostalgisk 2000-tals-estetik med MSN/LunarStorm-inspiration
- **Responsiv design** — Mobilanpassad med 390px viewport-stöd
