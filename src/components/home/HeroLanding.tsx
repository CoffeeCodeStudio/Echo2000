/**
 * @module HeroLanding
 * Cinematic retro hero with CRT boot-up, floating icons, glitch typography,
 * typewriter subtitle, and a pulsating CTA.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Volume2, VolumeX } from "lucide-react";
import { useCrtBootSound } from "@/hooks/useCrtBootSound";
import { useIsMobile } from "@/hooks/use-mobile";
import { Snowfall } from "./Snowfall";

/* ── types ── */
interface MemberAvatar {
  id: string;
  username: string;
  avatar_url: string | null;
}

/* ── floating retro icons ── */
const FLOATING_ICONS = [
  { emoji: "💾", x: "8%",  y: "15%", size: "32px", dur: "7s",  delay: "0s",   opacity: 0.25, rotS: -8,  rotE: 8 },
  { emoji: "📟", x: "85%", y: "12%", size: "28px", dur: "9s",  delay: "1s",   opacity: 0.2,  rotS: 5,   rotE: -5 },
  { emoji: "📀", x: "12%", y: "70%", size: "36px", dur: "8s",  delay: "0.5s", opacity: 0.2,  rotS: -12, rotE: 12 },
  { emoji: "🖥️", x: "90%", y: "65%", size: "30px", dur: "6s",  delay: "2s",   opacity: 0.18, rotS: 3,   rotE: -3 },
  { emoji: "📞", x: "18%", y: "42%", size: "24px", dur: "10s", delay: "1.5s", opacity: 0.15, rotS: -6,  rotE: 6 },
  { emoji: "🎵", x: "78%", y: "38%", size: "26px", dur: "7s",  delay: "3s",   opacity: 0.2,  rotS: 10,  rotE: -10 },
  { emoji: "✉️", x: "50%", y: "80%", size: "22px", dur: "11s", delay: "0.8s", opacity: 0.15, rotS: -4,  rotE: 4 },
  { emoji: "🌐", x: "35%", y: "10%", size: "20px", dur: "8s",  delay: "2.5s", opacity: 0.12, rotS: 6,   rotE: -6 },
  { emoji: "📱", x: "65%", y: "75%", size: "24px", dur: "9s",  delay: "1.2s", opacity: 0.18, rotS: -8,  rotE: 8 },
  { emoji: "🎧", x: "42%", y: "55%", size: "20px", dur: "12s", delay: "3.5s", opacity: 0.12, rotS: 3,   rotE: -3 },
];

/* ── typewriter hook ── */
function useTypewriter(text: string, speed = 40, startDelay = 1800) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let idx = 0;
    const start = () => {
      timer = setInterval(() => {
        idx++;
        setDisplayed(text.slice(0, idx));
        if (idx >= text.length) {
          clearInterval(timer);
          setDone(true);
        }
      }, speed);
    };
    const delayTimer = setTimeout(start, startDelay);
    return () => { clearTimeout(delayTimer); clearInterval(timer); };
  }, [text, speed, startDelay]);

  return { displayed, done };
}

/* ── avatar with initial-letter fallback ── */
function MemberBubble({ member, index }: { member: MemberAvatar; index: number }) {
  const initial = member.username.charAt(0).toUpperCase();
  const hasAvatar = !!member.avatar_url;
  const delay = `${2.2 + index * 0.1}s`;

  const baseClass =
    "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-primary/50 hero-reveal";

  return hasAvatar ? (
    <img
      src={member.avatar_url!}
      alt={member.username}
      title={member.username}
      className={`${baseClass} object-cover bg-muted`}
      style={{ animationDelay: delay }}
      loading="lazy"
    />
  ) : (
    <div
      title={member.username}
      className={`${baseClass} bg-primary/15 flex items-center justify-center text-primary font-bold text-sm sm:text-base`}
      style={{ animationDelay: delay }}
    >
      {initial}
    </div>
  );
}

/* ── skeleton while loading ── */
function SocialProofSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3 mt-10 animate-pulse">
      <div className="flex -space-x-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted/30 border-2 border-border" />
        ))}
      </div>
      <div className="h-4 w-48 rounded-full bg-muted/20" />
    </div>
  );
}

/* ── social proof row ── */
function SocialProof({ members, loading }: { members: MemberAvatar[]; loading: boolean }) {
  if (loading) return <SocialProofSkeleton />;
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 mt-10 hero-reveal" style={{ animationDelay: "2.8s" }}>
      <div className="flex -space-x-3">
        {members.map((m, i) => (
          <MemberBubble key={m.id} member={m} index={i} />
        ))}
      </div>
      <p className="text-sm flex items-center gap-1.5" style={{ color: "#8bb8c8" }}>
        <Users className="w-4 h-4" />
        <span>
          <strong className="text-white">{members.length}+</strong> medlemmar har redan gått med
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

/* ── nostalgic ticker ── */
const tickerText = "★ Gästbok ★ Profilbilder ★ Vänner ★ Status ★ Klotterplank ★ Spel ★ MSN-chatt ★ Lajv ★ DJ-spellista ★ Gästbok ★ Profilbilder ★ Vänner ★ Status ★ Klotterplank ★ Spel ★ MSN-chatt ★ Lajv ★ DJ-spellista ★ ";

/* ── main component ── */
export function HeroLanding() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [booted, setBooted] = useState(false);
  const [grainActive, setGrainActive] = useState(false);
  const isMobile = useIsMobile();
  const { muted, toggleMute, play: playCrtSound } = useCrtBootSound();

  const subtitle = "En nostalgisk community inspirerad av MSN Messenger, LunarStorm och Playahead — fast med dagens teknik.";
  const { displayed: typedText, done: typingDone } = useTypewriter(subtitle, 35, 1600);

  useEffect(() => {
    // Trigger boot animation + sound
    const t1 = setTimeout(() => {
      setBooted(true);
      playCrtSound();
    }, 100);
    const t2 = setTimeout(() => setGrainActive(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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

  const visibleIcons = isMobile ? FLOATING_ICONS.slice(0, 5) : FLOATING_ICONS;

  const floatingIcons = useMemo(() => (
    visibleIcons.map((icon, i) => (
      <span
        key={i}
        className="hero-floating-icon"
        style={{
          left: icon.x,
          top: icon.y,
          "--icon-size": icon.size,
          "--float-duration": icon.dur,
          "--float-delay": icon.delay,
          "--icon-opacity": icon.opacity,
          "--rot-start": `${icon.rotS}deg`,
          "--rot-end": `${icon.rotE}deg`,
        } as React.CSSProperties}
        aria-hidden="true"
      >
        {icon.emoji}
      </span>
    ))
  ), [visibleIcons]);

  return (
    <div
      className={`h-screen max-h-screen w-full overflow-hidden ${booted ? "hero-crt-boot" : "opacity-0"}`}
      style={{ background: "linear-gradient(135deg, #1a3a4a 0%, #2D6B81 35%, #1e4e62 70%, #163040 100%)" }}
    >
      {/* CRT scanlines */}
      <div className="hero-scanlines" />

      {/* VHS grain — skip on mobile for performance */}
      {!isMobile && <div className={`hero-grain ${grainActive ? "active" : ""}`} />}

      <div className="h-full flex flex-col items-center justify-center px-4 py-10 sm:py-16 relative">
        {/* Snowfall + sound controls */}
        <Snowfall />

        {/* CRT sound mute toggle */}
        <button
          onClick={toggleMute}
          className="fixed top-12 right-20 z-50 p-1.5 rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: "rgba(30, 78, 98, 0.7)",
            border: "1px solid rgba(90, 148, 171, 0.4)",
            color: muted ? "rgba(139, 184, 200, 0.5)" : "#8bb8c8",
          }}
          title={muted ? "Slå på CRT-ljud" : "Stäng av CRT-ljud"}
          aria-label={muted ? "Slå på CRT-ljud" : "Stäng av CRT-ljud"}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>


        {/* Floating retro icons */}
        {floatingIcons}


        {/* Headline — with glitch effect */}
        <h1 className="font-bold text-center max-w-4xl relative z-10" style={{ fontFamily: "'Trebuchet MS', sans-serif" }}>
          <span
            className="block text-3xl sm:text-5xl md:text-7xl text-white hero-reveal"
            style={{ lineHeight: 1.1, letterSpacing: "-0.03em", animationDelay: "0.6s" }}
          >
            Välkommen hem till
          </span>
          <span className="block mt-1 sm:mt-2">
            <span
              className="hero-glitch-text text-4xl sm:text-6xl md:text-8xl hero-reveal"
              data-text="2000"
              style={{
                animationDelay: "0.9s",
                lineHeight: 1.1,
                background: "linear-gradient(to bottom, #d8613e 0%, #b40c06 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              2000
            </span>
            <span
              className="text-4xl sm:text-6xl md:text-8xl text-white/90 hero-reveal"
              style={{ animationDelay: "1.1s", lineHeight: 1.1 }}
            >
              -talet
            </span>
          </span>
        </h1>

        {/* Typewriter subtitle */}
        <p
          className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-center max-w-2xl relative z-10 hero-reveal"
          style={{
            lineHeight: 1.65,
            letterSpacing: "0.3px",
            animationDelay: "1.3s",
            color: "#ccd5d8",
            fontFamily: "'Trebuchet MS', sans-serif",
            minHeight: "3.3em",
          }}
        >
          {typedText}
          {!typingDone && <span className="hero-cursor" />}
        </p>

        {/* Vision pills */}
        <div
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-7 relative z-10 hero-reveal"
          style={{ animationDelay: "1.5s" }}
        >
          {visionItems.map((v, i) => (
            <span
              key={v.text}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-white/90 select-none transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1e4e62 0%, #163040 100%)",
                border: "1px solid #5A94AB",
                boxShadow: "0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(216,97,62,0.6))",
                  display: "inline-block",
                }}
              >
                {v.emoji}
              </span>
              {v.text}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/auth")}
          className="hero-cta-button mt-8 sm:mt-10 px-10 sm:px-14 py-4 sm:py-5 text-base sm:text-lg font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[52px] relative z-10 hero-reveal"
          style={{ animationDelay: "1.8s", fontFamily: "'Trebuchet MS', sans-serif" }}
        >
          Skapa din profil
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="mt-4 text-sm hover:text-primary transition-colors underline underline-offset-4 min-h-[44px] flex items-center cursor-pointer relative z-10 hero-reveal"
          style={{ animationDelay: "2s", color: "#8bb8c8" }}
        >
          Har du redan konto? Logga in
        </button>

        {/* Social proof */}
        <SocialProof members={members} loading={loading} />

        {/* Bottom feature marquee */}
        <div
          className="absolute bottom-0 left-0 right-0 hero-reveal"
          style={{
            animationDelay: "2.5s",
            background: "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
            padding: "16px 0 8px",
          }}
        >
          <p className="text-center text-xs" style={{ color: "#5A94AB", letterSpacing: "2px" }}>
            ━━━ BETA v1.0 ━━━ COMMUNITY FÖR OSS SOM MINNS 56K-MODEM ━━━
          </p>
        </div>
      </div>
    </div>
  );
}
