/**
 * @module HomeContent
 * Main home page layout – thin render shell.
 * All widget boxes live in src/components/home/.
 */
import { RetroCrtTv } from "./RetroCrtTv";
import "./retro-crt.css";
import { NewsFeed } from "./social/NewsFeed";
import { HomeStatsBox } from "./home/HomeStatsBox";
import { HomeVisionBox } from "./home/HomeVisionBox";
import { HomeSocialBox } from "./home/HomeSocialBox";
import { HomeRecentOnline } from "./home/HomeRecentOnline";
import { HomeLajvBox } from "./home/HomeLajvBox";
import { HomeAuthBox } from "./home/HomeAuthBox";
import { HomeDjBox } from "./home/HomeDjBox";

export function HomeContent() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      {/* H1 Hero */}
      <section className="py-6 md:py-10 text-center px-4">
        <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-5xl leading-tight text-glow mb-3">
          <span className="text-primary">Echo</span>
          <span className="text-accent">2000</span>
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          En nostalgisk chatt-community inspirerad av bland annat MSN Messenger, LunarStorm och Playahead, återuppbyggd med modern design och funktioner.
        </p>

        {/* Pixel Welcome Banner */}
        <div className="pixel-banner max-w-md mx-auto mt-4">
          <p className="pixel-banner-text">
            <span className="pixel-star">✦</span>
            {" "}Välkommen till framtidens nostalgi{" "}
            <span className="pixel-star">✦</span>
          </p>
        </div>
      </section>

      {/* Retro CRT TV */}
      <section className="flex justify-center pb-6 px-4">
        <RetroCrtTv />
      </section>

      {/* 3-column grid – stacks on mobile */}
      <section className="container px-4 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <HomeStatsBox />
            <HomeVisionBox />
            <HomeSocialBox />
          </div>

          {/* Center Column */}
          <div className="space-y-4">
            <HomeRecentOnline />
            <NewsFeed />
            <HomeLajvBox />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <HomeAuthBox />
            <HomeDjBox />
          </div>
        </div>
      </section>
    </div>
  );
}
