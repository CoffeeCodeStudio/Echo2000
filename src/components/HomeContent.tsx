/**
 * @module HomeContent
 * Main home page layout – thin render shell.
 * Shows HeroLanding for guests, full dashboard for logged-in users.
 */
import "./retro-crt.css";
import "./home/hero-landing.css";
import { useAuth } from "@/hooks/useAuth";
import { HeroLanding } from "./home/HeroLanding";
import { NewsFeed } from "./social/NewsFeed";
import { HomeStatsBox } from "./home/HomeStatsBox";
import { HomeVisionBox } from "./home/HomeVisionBox";
import { HomeSocialBox } from "./home/HomeSocialBox";
import { HomeRecentOnline } from "./home/HomeRecentOnline";
import { HomeLajvBox } from "./home/HomeLajvBox";
import { HomeDjBox } from "./home/HomeDjBox";
import { CrtBackground } from "./CrtBackground";

export function HomeContent() {
  const { user, loading } = useAuth();

  if (loading) return null;

  /* ── Guest view: clean hero ── */
  if (!user) return <HeroLanding />;

  /* ── Logged-in view: full dashboard ── */
  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <CrtBackground>
        {/* Hero */}
        <section className="py-2 md:py-3 text-center px-4">
          <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl leading-tight text-glow mb-1">
            <span className="text-primary">Echo</span>
            <span className="text-accent">2000</span>
          </h1>
          <p className="text-muted-foreground text-[10px] sm:text-xs max-w-lg mx-auto leading-snug" style={{ textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
            En nostalgisk chatt-community inspirerad av MSN Messenger, LunarStorm och Playahead.
          </p>
        </section>

        {/* Stats + Vision */}
        <section className="px-2 sm:px-3 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
            <HomeStatsBox />
            <HomeVisionBox />
          </div>
        </section>

        {/* All widgets inside the TV */}
        <section className="px-2 sm:px-3 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 auto-rows-fr">
            <HomeSocialBox />
            <HomeRecentOnline />
            <NewsFeed />
            <HomeLajvBox />
            <div className="flex flex-col gap-2">
              <HomeDjBox />
            </div>
          </div>
        </section>
      </CrtBackground>
    </div>
  );
}
