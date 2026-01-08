import { Sparkles, MessageCircle, Users, Heart } from "lucide-react";
import { Button } from "./ui/button";

export function WelcomeHero() {
  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Background effects */}
      <div className="absolute inset-0 retro-gradient" />
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      {/* Grid overlay for retro feel */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgNDAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />

      <div className="relative container px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Sparkle badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>Welcome back to the good old days</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight text-glow mb-4 animate-fade-in">
            Chat Like It's{" "}
            <span className="text-primary">2005</span>
            <br />
            <span className="text-accent">Feel Like It's 2026</span>
          </h1>

          {/* Subheading */}
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-8 animate-fade-in">
            A nostalgic chat community inspired by MSN Messenger and LunarStorm, 
            rebuilt with modern design and features.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Button variant="msn" size="lg" className="w-full sm:w-auto">
              <MessageCircle className="w-5 h-5" />
              Start Chatting
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Users className="w-5 h-5" />
              Explore Community
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-border/50">
            <StatItem icon={<Users className="w-5 h-5" />} value="2.4k" label="Members" />
            <StatItem icon={<MessageCircle className="w-5 h-5" />} value="15k" label="Messages" />
            <StatItem icon={<Heart className="w-5 h-5" />} value="892" label="Connections" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ 
  icon, 
  value, 
  label 
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-primary">{icon}</div>
      <p className="font-display font-bold text-xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
