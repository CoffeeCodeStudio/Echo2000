import { useState, useEffect } from "react";
import { Loader2, Users } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { supabase } from "@/integrations/supabase/client";
import { usePresence } from "@/hooks/usePresence";
import { useNavigate } from "react-router-dom";

interface MemberProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export function MemberGrid() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserStatus, onlineUsers } = usePresence();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .order("created_at", { ascending: false });

      if (!error && data) setMembers(data);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const onlineCount = members.filter((m) => {
    const status = getUserStatus(m.user_id);
    return status === "online" || status === "away";
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <div className="container px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">Alla Medlemmar</h1>
            <p className="text-sm text-muted-foreground">
              {onlineCount} online av {members.length} medlemmar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {members.map((member) => {
            const status = getUserStatus(member.user_id);
            return (
              <button
                key={member.user_id}
                onClick={() => navigate(`/profile/${encodeURIComponent(member.username)}`)}
                className="nostalgia-card p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-all hover:-translate-y-0.5"
              >
                <div className="relative">
                  <Avatar name={member.username} src={member.avatar_url} size="lg" />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusIndicator status={status} size="md" />
                  </div>
                </div>
                <span className="text-sm font-medium truncate w-full text-center">
                  {member.username}
                </span>
              </button>
            );
          })}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Inga medlemmar hittades.</p>
          </div>
        )}
      </div>
    </div>
  );
}
