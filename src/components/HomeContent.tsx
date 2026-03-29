/**
 * @module HomeContent
 * Main home page layout – Lunar theme.
 * Shows HeroLanding for guests, Lunar dashboard for logged-in users.
 */
import "./home/hero-landing.css";
import { useAuth } from "@/hooks/useAuth";
import { HeroLanding } from "./home/HeroLanding";
import { NewsFeed } from "./social/NewsFeed";
import { HomeStatsBox } from "./home/HomeStatsBox";
import { HomeVisionBox } from "./home/HomeVisionBox";
import { HomeSocialBox } from "./home/HomeSocialBox";
import { HomeRecentOnline } from "./home/HomeRecentOnline";
import { HomeActivityFeed } from "./home/HomeActivityFeed";
import { HomeRecentKlotter } from "./home/HomeRecentKlotter";
import { ClearViewToggle } from "./home/ClearViewToggle";
import { useRadio } from "@/contexts/RadioContext";
import { Play, Pause, Music } from "lucide-react";

function DjQuickPlay() {
  const { isPlaying, currentStation, stations, selectStation, pause } = useRadio();
  const djStation = stations.find(s => s.isDj);
  const isDjPlaying = isPlaying && currentStation?.isDj;

  if (!djStation) return null;

  const handleClick = async () => {
    if (isDjPlaying) {
      pause();
    } else {
      await selectStation(djStation);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border border-primary/30 bg-primary/10 hover:bg-primary/20 transition-all text-[10px] font-mono text-primary hover:scale-105 active:scale-95"
      title={isDjPlaying ? "Pausa Community DJ" : "Spela Community DJ"}
    >
      {isDjPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
      <span className="max-w-[60px] truncate">{djStation.name}</span>
    </button>
  );
}

function DjEqualizer({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm bg-primary/70"
          style={{
            height: active ? undefined : `${3 + (i % 3) * 2}px`,
            animation: active
              ? `dj-eq-bar 0.${4 + i * 2}s ease-in-out infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

function DjEqualizerWidget() {
  const { isPlaying, currentStation } = useRadio();
  const isDjPlaying = isPlaying && currentStation?.isDj;
  return <DjEqualizer active={!!isDjPlaying} />;
}

export function HomeContent() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <HeroLanding />;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic" style={{ background: "hsl(var(--lunar-bg))" }}>
      {/* Hero header */}
      <section className="py-2 md:py-3 text-center px-4">
        <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl leading-tight mb-0.5">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#d8613e] to-[#b40c06] animate-[glow-pulse-orange_3s_ease-in-out_infinite]">
            Echo
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#5ABEDC] to-[#2D6B81] animate-[glow-pulse-teal_3s_ease-in-out_infinite]">
            2000
          </span>
        </h1>
        <p className="text-white/70 text-[10px] sm:text-xs leading-snug">Som förr. Fast nu</p>
        <div className="flex items-center justify-center gap-3 mt-1">
          <DjQuickPlay />
          <DjEqualizerWidget />
        </div>
      </section>

      {/* Stats + Vision — collapsed into one compact row */}
      <section className="px-3 sm:px-4 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
          <HomeStatsBox />
          <HomeVisionBox />
        </div>
      </section>

      {/* Bento grid */}
      <section className="px-3 sm:px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-fr">
          {/* Column 1: Online members + Activity feed */}
          <div className="flex flex-col gap-2">
            <HomeRecentOnline />
            <HomeActivityFeed />
          </div>

          {/* Column 2: News feed */}
          <div className="sm:col-span-1">
            <NewsFeed />
          </div>

          {/* Column 3: Klotter + Social */}
          <div className="flex flex-col gap-2">
            <HomeRecentKlotter />
            <HomeSocialBox />
          </div>
        </div>
      </section>
    </div>
  );
}
