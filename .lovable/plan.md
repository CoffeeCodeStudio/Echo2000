

## Plan: Ny landningssida med Remotion promo-video

### Översikt
Ersätt nuvarande HeroLanding med en ny, tydligare pitch-sida som inkluderar en kort Remotion-renderad promo-video som visar appens funktioner. Videon renderas till MP4 och bäddas in som en `<video>`-tagg på landningssidan.

### Steg 1 — Skapa Remotion-projekt och promo-video (~15s)

Sätt upp ett `remotion/`-projekt i repo-roten med följande scener:

1. **Intro** (3s) — "Echo2000" logotyp med retro typing-effekt, orange accent mot mörk bakgrund
2. **Profil-demo** (3s) — Mockup av en profilsida med gästbok, vänner, profilbild
3. **Chatt-demo** (3s) — MSN-inspirerad chattvy med bubblor som poppar in
4. **Klotterplank** (3s) — Ritningar som ritas upp i realtid (stroke animation)
5. **CTA-outro** (3s) — "Gå med idag. Helt gratis." med Echo2000-logga

**Stil:** Tidigt 2000-tal, Verdana/Tahoma, #ff6600 accent, #e5e5e5 bakgrund, flat 1px borders — matchande appens befintliga designspråk. Scanline-overlay för retro-känsla.

Renderas till `/mnt/documents/echo2000-promo.mp4`, sedan kopieras till `public/videos/echo2000-promo.mp4`.

### Steg 2 — Ersätt HeroLanding med ny pitch-sida

Uppdatera `src/components/home/HeroLanding.tsx` med:

- **Hero-sektion:** Stor rubrik "Välkommen till Echo2000" + kort tagline
- **Video-embed:** `<video>` med promo-videon, autoplay (muted), loop, med play-kontroll
- **3 USP-kort:** Gästbok, Chatt, Klotterplank — korta beskrivningar med emojis
- **Statistik-rad:** Medlemmar/meddelanden (behåll befintlig fetch från public-stats)
- **CTA-knappar:** "Skapa profil" + "Logga in" (behåll befintlig navigate-logik)
- **Footer:** "Inga algoritmer. Ingen reklam. Bara folk som vill hänga."

Behåller flat 2000-tals estetik med `border border-[#999]`, `bg-white`, `#ff6600`-accenter.

### Tekniska detaljer

| Del | Fil/plats |
|-----|-----------|
| Remotion-projekt | `remotion/` (ny mapp i repo-rot) |
| Video-output | `public/videos/echo2000-promo.mp4` |
| Landningssida | `src/components/home/HeroLanding.tsx` (ersätt) |
| Befintlig CSS | `src/components/home/hero-landing.css` (oförändrad) |
| Stats-fetch | Behålls från nuvarande HeroLanding |

