import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "./Avatar";
import { StatusIndicator } from "./StatusIndicator";
import { usePresence } from "@/hooks/usePresence";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";

interface RecentMember {
  user_id: string;
  username: string;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  last_seen: string | null;
}

export function RecentlyOnline() {
  const [members, setMembers] = useState<RecentMember[]>([]);
  const { getUserStatus } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url, age, gender, last_seen")
        .order("last_seen", { ascending: false })
        .limit(12);

      if (data) setMembers(data);
    };
    fetchRecent();
  }, []);

  if (members.length === 0) return null;

  return (
    <section className="container px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="font-display font-bold text-lg">Senaste inloggade</h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {members.map((member) => {
          const status = getUserStatus(member.user_id);
          return (
            <button
              key={member.user_id}
              onClick={() => navigate(`/profile/${encodeURIComponent(member.username)}`)}
              className="nostalgia-card p-3 flex flex-col items-center gap-1.5 hover:border-primary/50 transition-all hover:-translate-y-0.5"
            >
              <div className="relative">
                <Avatar name={member.username} src={member.avatar_url} size="lg" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <StatusIndicator status={status} size="sm" />
                </div>
              </div>
              <span className="text-xs font-medium truncate w-full text-center">
                {member.username}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {[member.age && `${member.age}`, member.gender].filter(Boolean).join(", ") || "—"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
