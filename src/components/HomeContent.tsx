/**
 * @module HomeContent
 * Main home page layout – Lunar theme.
 * Shows HeroLanding for guests, Lunar dashboard for logged-in users.
 */
import "./home/hero-landing.css";
import { useState, useRef, useEffect } from "react";
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
import { Play, Pause, Music, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";

function DjQuickPlay() {
  const { isPlaying, currentStation, stations, selectStation, pause, volume, setVolume } = useRadio();
  const [showVolume, setShowVolume] = useState(false);
  const volRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (volRef.current && !volRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVolume]);
  const djStations = stations.filter(s => s.isDj);
  const isDjPlaying = isPlaying && currentStation?.isDj;

  if (djStations.length === 0) return null;

  const currentDjIndex = djStations.findIndex(s => s.id === currentStation?.id);
  const activeDjStation = currentDjIndex >= 0 ? djStations[currentDjIndex] : djStations[0];

  const handleClick = async () => {
    if (isDjPlaying) {
      pause();
    } else {
      await selectStation(activeDjStation);
    }
  };

  const handleNext = async () => {
    const nextIndex = (currentDjIndex + 1) % djStations.length;
    await selectStation(djStations[nextIndex]);
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.4 ? Volume1 : Volume2;
  const volumePct = Math.round(volume * 100);

  return (
    <div className="inline-flex items-center gap-1 relative">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground transition-all text-[11px] font-bold shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-105 active:scale-95"
        title={isDjPlaying ? "Pausa Community DJ" : "Spela Community DJ"}
      >
        <Music className="w-3.5 h-3.5" />
        {isDjPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        <span className="max-w-[80px] truncate">{activeDjStation.name}</span>
      </button>
      {djStations.length > 1 && (
        <button
          onClick={handleNext}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/60 hover:bg-primary text-primary-foreground transition-all shadow-sm hover:scale-110 active:scale-95"
          title="Nästa DJ-låt"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => setShowVolume(v => !v)}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/60 hover:bg-muted text-foreground/70 hover:text-foreground transition-all shadow-sm hover:scale-110 active:scale-95"
        title={`Volym: ${volumePct}%`}
      >
        <VolumeIcon className="w-3.5 h-3.5" />
      </button>
      {showVolume && (
        <div className="absolute top-full mt-2 right-0 flex items-center gap-2 bg-card/95 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-lg z-50">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1 accent-primary cursor-pointer"
          />
          <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{volumePct}%</span>
        </div>
      )}
    </div>
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
