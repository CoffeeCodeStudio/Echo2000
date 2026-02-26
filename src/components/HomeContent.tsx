import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Wifi, Gamepad2, Palette, Heart, Radio, Music, ExternalLink, Bot } from "lucide-react";
import { RetroCrtTv } from "./RetroCrtTv";
import "./retro-crt.css";
import { NewsFeed } from "./social/NewsFeed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { Avatar } from "./Avatar";
import { StatusIndicator } from "./StatusIndicator";
import { Button } from "./ui/button";
import { AuthDialog } from "./auth/AuthDialog";

// --- Left Column Components ---

function StatsBox() {
  const [stats, setStats] = useState({ members: 0, online: 0, messages: 0 });
  const { user } = useAuth();
  const { onlineUsers } = usePresence();

  useEffect(() => {
    const fetchStats = async () => {
      if (user) {
        const [{ count: memberCount }, { count: msgCount }] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("chat_messages").select("*", { count: "exact", head: true }),
        ]);
        setStats({ members: memberCount ?? 0, online: 0, messages: msgCount ?? 0 });
      } else {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-stats`,
            { headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
          );
          if (res.ok) {
            const data = await res.json();
            setStats({ members: data.stats.members, online: 0, messages: data.stats.messages });
          }
        } catch {}
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary">📊 Snabbstatistik</h3>
      </div>
      <div className="p-3 space-y-2 bg-card">
        <StatRow icon={<Users className="w-4 h-4 text-primary" />} label="Medlemmar" value={stats.members} />
        <StatRow icon={<Wifi className="w-4 h-4 text-[hsl(var(--online-green))]" />} label="Online" value={onlineUsers?.size ?? 0} />
        <StatRow icon={<MessageCircle className="w-4 h-4 text-accent" />} label="Meddelanden" value={stats.messages} />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">{icon} {label}</span>
      <span className="font-bold text-foreground">{value.toLocaleString("sv-SE")}</span>
    </div>
  );
}

function VisionBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary">💡 Vår Vision</h3>
      </div>
      <div className="p-3 bg-card space-y-2">
        <VisionItem icon={<Gamepad2 className="w-4 h-4 text-primary" />} text="Spel & Tävlingar" />
        <VisionItem icon={<Palette className="w-4 h-4 text-accent" />} text="Konst & Kreativitet" />
        <VisionItem icon={<Heart className="w-4 h-4 text-destructive" />} text="Gemenskap & Vänskap" />
        {/* Pixel robot mascot */}
        <div className="flex items-start gap-2 pt-2 mt-2 border-t border-border">
          <div className="flex-shrink-0">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div className="relative bg-muted/60 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
            <div className="absolute -left-1.5 top-2 w-0 h-0 border-t-[5px] border-t-transparent border-r-[6px] border-r-border border-b-[5px] border-b-transparent" />
            Vad väntar du på? Inget MSN-virus här inte!
          </div>
        </div>
      </div>
    </div>
  );
}

function VisionItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function SocialBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary">🌐 Sociala Medier</h3>
      </div>
      <div className="p-3 bg-card flex flex-wrap gap-2">
        <SocialLink label="Discord" />
        <SocialLink label="Instagram" />
        <SocialLink label="TikTok" />
      </div>
    </div>
  );
}

function SocialLink({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border hover:border-primary/40">
      <ExternalLink className="w-3 h-3" />
      {label}
    </button>
  );
}

// --- Center Column Components ---

function RecentOnlineBox() {
  const [members, setMembers] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .order("last_seen", { ascending: false })
          .limit(10);
        if (data) setMembers(data);
      } else {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-stats`,
            { headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.recentMembers) setMembers(data.recentMembers);
          }
        } catch {}
      }
    };
    fetchRecent();
  }, [user]);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary">👥 Senaste Inloggade</h3>
      </div>
      <div className="p-3 bg-card">
        {members.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">Inga medlemmar ännu</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {members.map((m) => {
              const status = getUserStatus(m.user_id);
              return (
                <button
                  key={m.user_id}
                  onClick={() => navigate(`/profile/${encodeURIComponent(m.username)}`)}
                  className="flex flex-col items-center gap-1 p-1 rounded hover:bg-muted/50 transition-colors min-h-[44px]"
                >
                  <div className="relative">
                    <Avatar name={m.username} src={m.avatar_url} size="sm" />
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <StatusIndicator status={status} size="sm" />
                    </div>
                  </div>
                  <span className="text-[10px] truncate w-full text-center text-muted-foreground">{m.username}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LajvBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary flex items-center gap-1">
          <Radio className="w-4 h-4 animate-pulse" /> Lajv Just Nu!
        </h3>
      </div>
      <div className="p-4 bg-card flex flex-col items-center justify-center text-center min-h-[80px]">
        <Radio className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Kommer snart</p>
      </div>
    </div>
  );
}

// --- Right Column Components ---

function AuthBox() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  if (user) return null;

  return (
    <>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
          <h3 className="font-display font-bold text-sm text-primary">🔑 Logga in / Registrera</h3>
        </div>
        <div className="p-3 bg-card space-y-2">
          <p className="text-xs text-muted-foreground">Gå med i communityn och börja chatta!</p>
          <div className="flex gap-2">
            <Button size="sm" variant="msn" className="flex-1 text-xs" onClick={() => navigate("/auth")}>
              Logga in
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => navigate("/auth")}>
              Registrera
            </Button>
          </div>
        </div>
      </div>
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} />
    </>
  );
}

function DjBox() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="bg-primary/20 border-b border-primary/30 px-3 py-1.5">
        <h3 className="font-display font-bold text-sm text-primary flex items-center gap-1">
          <Music className="w-4 h-4" /> Dagens DJ
        </h3>
      </div>
      <div className="p-4 bg-card flex flex-col items-center justify-center text-center min-h-[80px]">
        <Music className="w-8 h-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Kommer snart</p>
      </div>
    </div>
  );
}

// --- Main HomeContent ---

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
            <StatsBox />
            <VisionBox />
            <SocialBox />
          </div>

          {/* Center Column */}
          <div className="space-y-4">
            <RecentOnlineBox />
            <NewsFeed />
            <LajvBox />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <AuthBox />
            <DjBox />
          </div>
        </div>
      </section>
    </div>
  );
}
