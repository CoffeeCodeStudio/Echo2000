import { Sparkles, MessageCircle, Users, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { StarryBackground } from "./StarryBackground";

export function WelcomeHero() {
  return (
    <section className="relative overflow-hidden py-12 md:py-20">
      {/* Animated starry background */}
      <StarryBackground />

      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gradient-start))] via-[hsl(var(--gradient-mid))] to-[hsl(var(--gradient-end))]" />

      {/* Soft gradient orbs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary/15 rounded-full blur-[100px] animate-float" />
      <div
        className="absolute bottom-10 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-[100px] animate-float"
        style={{ animationDelay: "-1.5s" }}
      />

      <div className="relative container px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Sparkle badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span>Välkommen tillbaka till de goda tiderna</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl leading-tight text-glow mb-4 animate-fade-in">
            <span className="text-primary">Echo</span>
            <span className="text-accent">2000</span>
            <br />
            <span className="text-foreground/80 text-2xl sm:text-3xl md:text-4xl">Chatta som förr</span>
          </h1>

          {/* Subheading */}
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-8 animate-fade-in">
            En nostalgisk chatt-community inspirerad av bland annat MSN Messenger, LunarStorm och Playahead,
            återuppbyggd med modern design och funktioner.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Button variant="msn" size="lg" className="w-full sm:w-auto">
              <MessageCircle className="w-5 h-5" />
              Börja chatta
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Users className="w-5 h-5" />
              Utforska communityn
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-border/50">
            <StatItem icon={<Users className="w-5 h-5" />} value="2.4k" label="Medlemmar" />
            <StatItem icon={<MessageCircle className="w-5 h-5" />} value="15k" label="Meddelanden" />
            <StatItem icon={<Heart className="w-5 h-5" />} value="892" label="Vänner" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-primary">{icon}</div>
      <p className="font-display font-bold text-xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
