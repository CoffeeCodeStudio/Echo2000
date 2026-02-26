import { useState, useEffect } from "react";
import { Users, MessageCircle, Wifi, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { BentoCard } from "./BentoCard";

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground shrink-0">{icon} {label}</span>
      <span className="font-bold text-foreground shrink-0">{value.toLocaleString("sv-SE")}</span>
    </div>
  );
}

export function HomeStatsBox() {
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
    <BentoCard title="Snabbstatistik" icon={<BarChart3 className="w-4 h-4" />}>
      <div className="space-y-3">
        <StatRow icon={<Users className="w-4 h-4 text-primary" />} label="Medlemmar" value={stats.members} />
        <StatRow icon={<Wifi className="w-4 h-4 text-online" />} label="Online" value={onlineUsers?.size ?? 0} />
        <StatRow icon={<MessageCircle className="w-4 h-4 text-accent" />} label="Meddelanden" value={stats.messages} />
      </div>
    </BentoCard>
  );
}
