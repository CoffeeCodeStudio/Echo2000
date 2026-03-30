import { useState, useEffect, useCallback, useRef } from "react";
import { Users, MessageCircle, BarChart3, BookOpen, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { BentoCard } from "./BentoCard";

const CACHE_KEY = "echo2000_stats";

interface Stats {
  members: number;
  online: number;
  messages: number;
  guestbook: number;
  klotter: number;
}

function loadCached(): Stats {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { members: 0, online: 0, messages: 0, guestbook: 0, klotter: 0 };
}

function saveCache(s: Stats) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}

function useCountUp(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) { setDisplay(target); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (target - from) * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const displayed = useCountUp(value);
  return (
    <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground shrink-0">{icon} {label}</span>
      <span className="font-bold text-foreground shrink-0">{displayed.toLocaleString("sv-SE")}</span>
    </div>
  );
}

export function HomeStatsBox() {
  const [stats, setStats] = useState<Stats>(loadCached);
  const [onlineBotCount, setOnlineBotCount] = useState(0);
  const { user } = useAuth();
  const { onlineUsers } = usePresence();

  useEffect(() => {
    const fetchOnlineBots = async () => {
      const eightMinAgo = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_bot", true)
        .gte("last_seen", eightMinAgo);
      setOnlineBotCount(count ?? 0);
    };
    fetchOnlineBots();
    const interval = setInterval(fetchOnlineBots, 60_000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = useCallback(async () => {
    if (user) {
      // Single RPC call for all counts
      const { data, error } = await supabase.rpc('get_community_stats');
      if (!error && data) {
        const d = data as { members: number; messages: number; guestbook: number; klotter: number };
        const next: Stats = { members: d.members, online: 0, messages: d.messages, guestbook: d.guestbook, klotter: d.klotter };
        setStats(next);
        saveCache(next);
      }
    } else {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-stats`,
          { headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        if (res.ok) {
          const data = await res.json();
          const next = { members: data.stats.members, online: 0, messages: data.stats.messages, guestbook: 0, klotter: 0 };
          setStats(next);
          saveCache(next);
        }
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("stats-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profile_guestbook" }, () => fetchStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "klotter" }, () => fetchStats())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "profile_guestbook" }, () => fetchStats())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "klotter" }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchStats]);

  const totalOnline = (onlineUsers?.size ?? 0) + onlineBotCount;

  return (
    <BentoCard title="Snabbstatistik" icon={<BarChart3 className="w-4 h-4" />}>
      <div className="space-y-1.5">
        <StatRow icon={<Users className="w-4 h-4 text-primary" />} label="Medlemmar" value={stats.members} />
        <StatRow icon={<MessageCircle className="w-4 h-4 text-accent" />} label="Meddelanden" value={stats.messages} />
        <StatRow icon={<BookOpen className="w-4 h-4 text-accent" />} label="Gästboksinlägg" value={stats.guestbook} />
        <StatRow icon={<Palette className="w-4 h-4 text-primary" />} label="Klotterteckningar" value={stats.klotter} />
      </div>
    </BentoCard>
  );
}
