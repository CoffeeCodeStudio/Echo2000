/**
 * @module MsnSettingsBlocked
 * "Blockerade användare" settings section — lists blocked users with unblock buttons.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBlockList } from "@/hooks/useBlockList";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BlockedUser {
  blocked_id: string;
  username: string;
  avatar_url: string | null;
}

export function MsnSettingsBlocked() {
  const { user } = useAuth();
  const { unblockUser } = useBlockList();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("block_list")
        .select("blocked_id")
        .eq("blocker_id", user.id);

      if (!data || data.length === 0) {
        setBlockedUsers([]);
        setLoading(false);
        return;
      }

      const ids = data.map((r: any) => r.blocked_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", ids);

      setBlockedUsers(
        (profiles || []).map((p: any) => ({
          blocked_id: p.user_id,
          username: p.username,
          avatar_url: p.avatar_url,
        }))
      );
      setLoading(false);
    })();
  }, [user]);

  const handleUnblock = async (blockedId: string, username: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u.blocked_id !== blockedId));
    const ok = await unblockUser(blockedId);
    if (ok) {
      toast.success(`${username} avblockerad`);
    } else {
      toast.error("Kunde inte avblockera");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-bold mb-3">🚫 Blockerade användare</h3>

      {blockedUsers.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">
          Du har inte blockerat någon.
        </p>
      ) : (
        <div className="space-y-1">
          {blockedUsers.map((u) => (
            <div
              key={u.blocked_id}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={u.avatar_url || "/placeholder.svg"}
                  alt={u.username}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
                <span className="text-xs font-medium truncate">{u.username}</span>
              </div>
              <button
                onClick={() => handleUnblock(u.blocked_id, u.username)}
                className="msn-settings-btn text-[10px] px-2 py-0.5 flex-shrink-0"
              >
                Avblockera
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
