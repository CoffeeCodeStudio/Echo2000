/**
 * @module HomeContent
 * Main home page layout – thin render shell.
 * All widget boxes live in src/components/home/.
 */
import "./retro-crt.css";
import { NewsFeed } from "./social/NewsFeed";
import { HomeStatsBox } from "./home/HomeStatsBox";
import { HomeVisionBox } from "./home/HomeVisionBox";
import { HomeSocialBox } from "./home/HomeSocialBox";
import { HomeRecentOnline } from "./home/HomeRecentOnline";
import { HomeLajvBox } from "./home/HomeLajvBox";
import { HomeAuthBox } from "./home/HomeAuthBox";
import { HomeDjBox } from "./home/HomeDjBox";
import { CrtBackground } from "./CrtBackground";

export function HomeContent() {
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
        <section className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
            <HomeStatsBox />
            <HomeVisionBox />
          </div>
        </section>

        {/* All widgets inside the TV */}
        <section className="px-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 max-w-5xl mx-auto">
            <HomeSocialBox />
            <HomeRecentOnline />
            <NewsFeed />
            <HomeLajvBox />
            <div className="space-y-2">
              <HomeAuthBox />
              <HomeDjBox />
            </div>
          </div>
        </section>
      </CrtBackground>
    </div>
  );
}
