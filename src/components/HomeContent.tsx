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
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";

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
      <button onClick={handlePlay} className="px-2 py-0.5 text-[10px] font-bold bg-[#ff6600] text-white border border-[#cc5500] hover:bg-[#e55c00] flex items-center gap-1">
        {isPlaying && currentStation?.isDj ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        DJ
      </button>
      {isPlaying && currentStation?.isDj && djStations.length > 1 && (
        <button onClick={handleNext} className="px-1 py-0.5 bg-[#ddd] border border-[#999] hover:bg-[#ccc]">
          <SkipForward className="w-3 h-3" />
        </button>
      )}
      <div className="relative" ref={volRef}>
        <button onClick={() => setShowVolume(!showVolume)} className="px-1 py-0.5 bg-[#ddd] border border-[#999] hover:bg-[#ccc]">
          <Volume2 className="w-3 h-3" />
        </button>
        {showVolume && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-[#999] p-2 z-50 w-24">
            <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full" />
            <div className="text-[9px] text-center text-[#666]">{volume}%</div>
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
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-[#e5e5e5]">
      {/* Welcome header */}
      <div className="bg-white border-b border-[#999] px-3 py-2 flex items-center justify-between">
        <div>
          <span className="text-[13px] font-bold text-[#222]">
            Välkommen till <span className="text-[#ff6600]">Echo2000</span>
          </span>
          <span className="text-[10px] text-[#666] ml-2">Som förr. Fast nu.</span>
        </div>
        <DjQuickPlay />
      </div>

      {/* Main content — stacked flat boxes */}
      <div className="p-2 flex flex-col lg:flex-row gap-2">
        {/* Left column */}
        <div className="flex flex-col gap-2 lg:w-[200px] lg:shrink-0">
          <HomeStatsBox />
          <HomeVisionBox />
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
          <HomeSocialBox />
        </div>
      </div>
    </div>
  );
}
