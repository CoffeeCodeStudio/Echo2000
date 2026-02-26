import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { Avatar } from "../Avatar";
import { StatusIndicator } from "../StatusIndicator";

export function HomeRecentOnline() {
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
