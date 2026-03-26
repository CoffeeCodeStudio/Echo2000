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

export function HomeContent() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <HeroLanding />;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic" style={{ background: "hsl(var(--lunar-bg))" }}>
      {/* Hero header */}
      <section className="py-2 md:py-3 text-center px-4">
        <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl leading-tight mb-0.5">
          <span className="text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.4)" }}>
            Echo
          </span>
          <span className="text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.4)" }}>
            2000
          </span>
        </h1>
        <p className="text-white/70 text-[10px] sm:text-xs max-w-lg mx-auto leading-snug">Som förr. Fast nu</p>
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
