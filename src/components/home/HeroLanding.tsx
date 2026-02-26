/**
 * @module HeroLanding
 * Full-screen hero landing page for logged-out users.
 * Minimal, focused: headline → CTA → social proof.
 * Zero flicker, high contrast, accessibility-first.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

/* ── tiny avatar row ── */
interface MemberAvatar {
  id: string;
  username: string;
  avatar_url: string | null;
}

function SocialProof({ members }: { members: MemberAvatar[] }) {
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 mt-8">
      <div className="flex -space-x-3">
        {members.map((m) => (
          <img
            key={m.id}
            src={m.avatar_url || "/placeholder.svg"}
            alt={m.username}
            title={m.username}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary/60 object-cover bg-muted"
          />
        ))}
      </div>
      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
        <Users className="w-4 h-4" />
        <span>
          <strong className="text-foreground">{members.length}+</strong> medlemmar har redan gått med
        </span>
      </p>
    </div>
  );
}

/* ── vision pills ── */
const visionItems = [
  { emoji: "💬", text: "MSN-chatt" },
  { emoji: "🎮", text: "Retro-spel" },
  { emoji: "🎨", text: "Klotterplank" },
  { emoji: "❤️", text: "Gemenskap" },
];

export function HeroLanding() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberAvatar[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (data) setMembers(data);
    };
    fetchMembers();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* Headline */}
        <h1 className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-center leading-tight max-w-3xl">
          <span className="text-foreground">Välkommen hem till</span>
          <br />
          <span className="text-primary">2000</span>
          <span className="text-accent">-talet</span>
        </h1>

        <p
          className="mt-4 sm:mt-6 text-muted-foreground text-base sm:text-lg text-center max-w-xl leading-relaxed"
          style={{ letterSpacing: "0.3px" }}
        >
          En nostalgisk community inspirerad av MSN&nbsp;Messenger, LunarStorm
          och Playahead — fast med dagens teknik.
        </p>

        {/* Vision pills */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
          {visionItems.map((v) => (
            <span
              key={v.text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-muted/60 border border-border text-foreground"
            >
              <span>{v.emoji}</span> {v.text}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/auth")}
          className="hero-cta-button mt-8 sm:mt-10 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          Skapa din profil
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="mt-3 text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Har du redan konto? Logga in
        </button>

        {/* Social proof */}
        <SocialProof members={members} />
      </div>
    </div>
  );
}
