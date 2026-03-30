import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { StatusIndicator } from "../StatusIndicator";
import type { UserStatus } from "../StatusIndicator";
import { Users } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { AiBadge } from "../AiBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { sanitizeAvatarUrl } from "@/lib/avatar-url";

const BOT_ONLINE_THRESHOLD_MS = 8 * 60 * 1000;

export function HomeRecentOnline() {
  const [members, setMembers] = useState<{ user_id: string; username: string; avatar_url: string | null; is_bot?: boolean; last_seen?: string | null; age?: number | null; gender?: string | null }[]>([]);
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { getUserStatus } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, is_bot, last_seen, age, gender")
          .order("last_seen", { ascending: false })
          .limit(5);
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

  const getMemberStatus = (m: typeof members[0]): UserStatus => {
    if (m.is_bot && m.last_seen) {
      const age = Date.now() - new Date(m.last_seen).getTime();
      if (age < BOT_ONLINE_THRESHOLD_MS) return "online";
      return "offline";
    }
    return getUserStatus(m.user_id);
  };

  const statusOrder: Record<UserStatus, number> = { online: 0, away: 1, busy: 2, offline: 3 };

  const sortedMembers = [...members]
    .map((m) => ({ ...m, _status: getMemberStatus(m) }))
    .sort((a, b) => {
      const diff = statusOrder[a._status] - statusOrder[b._status];
      if (diff !== 0) return diff;
      const aTime = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      const bTime = b.last_seen ? new Date(b.last_seen).getTime() : 0;
      if (a._status === "online" || a._status === "away") return aTime - bTime;
      return bTime - aTime;
    });

  return (
    <BentoCard title="Senaste Inloggade" icon={<Users className="w-4 h-4" />} contentClassName="p-1">
      {sortedMembers.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Inga medlemmar ännu</p>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="flex gap-1">
            {sortedMembers.slice(0, 5).map((m) => {
              const initials = m.username.slice(0, 2).toUpperCase();
              const infoLine = [m.age ? `${m.age} år` : null, m.gender].filter(Boolean).join(", ");
              return (
                <Tooltip key={m.user_id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(`/profile/${encodeURIComponent(m.username)}`)}
                      className="relative w-full aspect-square rounded-sm border border-border hover:border-primary/60 transition-all cursor-pointer group"
                      style={{ overflow: 'hidden' }}
                    >
                      {sanitizeAvatarUrl(m.avatar_url) && !brokenImgs.has(m.user_id) ? (
                        <img src={sanitizeAvatarUrl(m.avatar_url)!} alt={m.username} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" onError={() => setBrokenImgs(prev => new Set(prev).add(m.user_id))} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-bold text-foreground text-sm">
                          {initials}
                        </div>
                      )}
                      <div className="absolute bottom-0.5 right-0.5">
                        <StatusIndicator status={m._status} size="sm" />
                      </div>
                      {m.is_bot && (
                        <div className="absolute top-0.5 left-0.5">
                          <AiBadge className="text-[7px] px-0.5 py-0" />
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-bold">{m.username}</p>
                    {infoLine && <p className="text-muted-foreground">{infoLine}</p>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </BentoCard>
  );
}
