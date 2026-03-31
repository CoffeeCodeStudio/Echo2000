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
  const navigate = useNavigate();
  const { messages } = useLajv();
  const [lajvIndex, setLajvIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => setLajvIndex((p) => (p + 1) % messages.length), 5000);
    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    if (lajvIndex >= messages.length && messages.length > 0) setLajvIndex(0);
  }, [messages.length, lajvIndex]);

  const currentLajv = messages[lajvIndex];

  if (loading) return null;
  if (!user) return <HeroLanding />;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
      {/* Combined welcome + lajv header */}
      <div className="bg-gradient-to-r from-card via-card to-muted border-b-2 border-primary px-3 py-1.5 flex items-center gap-2">
        {/* Lajv on the left */}
        <div
          className="flex items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate('/', { state: { tab: 'lajv' } })}
        >
          <div className="relative">
            <Radio className="w-3.5 h-3.5 text-primary" />
            {messages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">LAJV</span>
        </div>

        {/* Lajv message */}
        <div className="flex-1 min-w-0">
          {messages.length === 0 ? (
            <span className="text-[10px] italic text-muted-foreground truncate">Inga aktiva lajv</span>
          ) : currentLajv ? (
            <div className="flex items-center gap-1.5 text-[10px] animate-fade-in">
              <div className="shrink-0 w-4 h-4 rounded-full overflow-hidden">
                <Avatar name={currentLajv.username} src={currentLajv.avatar_url || undefined} size="sm" />
              </div>
              <span className="font-bold text-foreground shrink-0 max-w-[80px] truncate">{currentLajv.username}:</span>
              <span className="truncate text-muted-foreground">{replaceEmoteCodes(currentLajv.message)}</span>
            </div>
          ) : null}
        </div>

        {/* DJ controls on the right */}
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
