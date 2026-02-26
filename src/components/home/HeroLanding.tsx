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

/* ── types ── */
interface MemberAvatar {
  id: string;
  username: string;
  avatar_url: string | null;
}

/* ── avatar with initial-letter fallback ── */
function MemberBubble({ member }: { member: MemberAvatar }) {
  const initial = member.username.charAt(0).toUpperCase();
  const hasAvatar = !!member.avatar_url;

  return hasAvatar ? (
    <img
      src={member.avatar_url!}
      alt={member.username}
      title={member.username}
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary/60 object-cover bg-muted"
      loading="lazy"
    />
  ) : (
    <div
      title={member.username}
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary/60 bg-primary/20 flex items-center justify-center text-primary font-bold text-sm sm:text-base"
    >
      {initial}
    </div>
  );
}

/* ── skeleton while loading ── */
function SocialProofSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 mt-8 animate-pulse">
      <div className="flex -space-x-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/40 border-2 border-border"
          />
        ))}
      </div>
      <div className="h-4 w-48 rounded bg-muted/30" />
    </div>
  );
}

/* ── social proof row ── */
function SocialProof({
  members,
  loading,
}: {
  members: MemberAvatar[];
  loading: boolean;
}) {
  if (loading) return <SocialProofSkeleton />;
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 mt-8">
      <div className="flex -space-x-3">
        {members.map((m) => (
          <MemberBubble key={m.id} member={m} />
        ))}
      </div>
      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
        <Users className="w-4 h-4" />
        <span>
          <strong className="text-foreground">{members.length}+</strong>{" "}
          medlemmar har redan gått med
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

/* ── main component ── */
export function HeroLanding() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberAvatar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(8);
        if (data) setMembers(data);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* Headline */}
        <h1
          className="font-display font-bold text-3xl sm:text-5xl md:text-6xl text-center leading-tight max-w-3xl"
          style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
        >
          <span className="text-foreground">Välkommen hem till</span>
          <br />
          <span className="text-primary">2000</span>
          <span className="text-accent">-talet</span>
        </h1>

        <p
          className="mt-4 sm:mt-6 text-muted-foreground text-base sm:text-lg text-center max-w-xl"
          style={{ lineHeight: 1.6, letterSpacing: "0.3px" }}
        >
          En nostalgisk community inspirerad av MSN&nbsp;Messenger, LunarStorm
          och Playahead — fast med dagens teknik.
        </p>

        {/* Vision pills */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
          {visionItems.map((v) => (
            <span
              key={v.text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-muted/60 border border-border text-foreground select-none"
            >
              <span aria-hidden="true">{v.emoji}</span> {v.text}
            </span>
          ))}
        </div>

        {/* CTA — min 44px touch target */}
        <button
          onClick={() => navigate("/auth")}
          className="hero-cta-button mt-8 sm:mt-10 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background min-h-[48px]"
        >
          Skapa din profil
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="mt-3 text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 min-h-[44px] flex items-center"
        >
          Har du redan konto? Logga in
        </button>

        {/* Social proof */}
        <SocialProof members={members} loading={loading} />
      </div>
    </div>
  );
}
