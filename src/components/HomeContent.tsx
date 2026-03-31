import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { HeroLanding } from "./home/HeroLanding";
import { HomeStatsBox } from "./home/HomeStatsBox";
import { HomeVisionBox } from "./home/HomeVisionBox";
import { HomeRecentOnline } from "./home/HomeRecentOnline";
import { HomeActivityFeed } from "./home/HomeActivityFeed";
import { NewsFeed } from "./social/NewsFeed";
import { HomeSocialBox } from "./home/HomeSocialBox";
import { HomeRecentKlotter } from "./home/HomeRecentKlotter";
import { useRadio } from "@/contexts/RadioContext";
import { useLajv } from "@/contexts/LajvContext";
import { Avatar } from "./Avatar";
import { replaceEmoteCodes } from "./social/PixelEmotes";
import { useNavigate } from "react-router-dom";
import { Play, Pause, SkipForward, Volume2, Radio } from "lucide-react";

function DjQuickPlay() {
  const { isPlaying, currentStation, stations, selectStation, pause, volume, setVolume } = useRadio();
  const [showVolume, setShowVolume] = useState(false);
  const volRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (volRef.current && !volRef.current.contains(e.target as Node)) setShowVolume(false);
    };
    if (showVolume) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVolume]);

  const djStations = stations.filter((s) => s.isDj);
  const handlePlay = async () => {
    if (isPlaying && currentStation?.isDj) { pause(); return; }
    const target = djStations.length > 0 ? djStations[0] : stations[0];
    if (target) await selectStation(target);
  };
  const handleNext = async () => {
    if (djStations.length < 2) return;
    const idx = djStations.findIndex((s) => s.id === currentStation?.id);
    const next = djStations[(idx + 1) % djStations.length];
    await selectStation(next);
  };

  return (
    <div className="inline-flex items-center gap-1">
      <button onClick={handlePlay} className="px-2 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground border border-[hsl(24,100%,40%)] hover:opacity-90 flex items-center gap-1 transition-opacity">
        {isPlaying && currentStation?.isDj ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        DJ
      </button>
      {isPlaying && currentStation?.isDj && djStations.length > 1 && (
        <button onClick={handleNext} className="px-1 py-0.5 bg-muted border border-border hover:bg-accent/20 transition-colors">
          <SkipForward className="w-3 h-3" />
        </button>
      )}
      <div className="relative" ref={volRef}>
        <button onClick={() => setShowVolume(!showVolume)} className="px-1 py-0.5 bg-muted border border-border hover:bg-accent/20 transition-colors">
          <Volume2 className="w-3 h-3" />
        </button>
        {showVolume && (
          <div className="absolute top-full right-0 mt-1 bg-card border border-border p-2 z-50 w-24">
            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-primary" />
            <div className="text-[9px] text-center text-muted-foreground">{volume}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function HomeContent() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <HeroLanding />;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
      {/* Welcome header — polished with gradient */}
      <div className="bg-gradient-to-r from-card via-card to-muted border-b-2 border-primary px-3 py-2.5 flex items-center justify-center gap-3">
        <div className="text-center">
          <span className="text-[13px] font-bold text-foreground">
            Välkommen till <span className="text-primary">Echo2000</span>
          </span>
          <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">Som förr. Fast nu.</span>
        </div>
        <DjQuickPlay />
      </div>

      {/* Main content — three-column layout */}
      <div className="p-2 flex flex-col lg:flex-row gap-2">
        {/* Left column */}
        <div className="flex flex-col gap-2 lg:w-[210px] lg:shrink-0">
          <HomeStatsBox />
          <HomeVisionBox />
          <HomeSocialBox />
        </div>

        {/* Center column */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <HomeRecentOnline />
          <NewsFeed />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-2 lg:w-[240px] lg:shrink-0">
          <HomeActivityFeed />
          <HomeRecentKlotter />
        </div>
      </div>
    </div>
  );
}
