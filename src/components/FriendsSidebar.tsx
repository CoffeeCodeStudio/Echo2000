import { Search, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { FriendItem } from "./FriendItem";
import { cn } from "@/lib/utils";
import type { UserStatus } from "./StatusIndicator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
}

interface FriendsSidebarProps {
  selectedFriendId?: string;
  onSelectFriend: (id: string) => void;
  className?: string;
}

export function FriendsSidebar({ selectedFriendId, onSelectFriend, className }: FriendsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineExpanded, setOnlineExpanded] = useState(true);
  const [offlineExpanded, setOfflineExpanded] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch real friends from database
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data: friendships, error } = await supabase
          .from("friends")
          .select("*")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq("status", "accepted");

        if (error) throw error;

        if (!friendships || friendships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendUserIds = friendships.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message")
          .in("user_id", friendUserIds);

        const friendsList: Friend[] = friendships.map((friendship) => {
          const friendUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
          const profile = profiles?.find((p) => p.user_id === friendUserId);

          return {
            id: friendUserId,
            name: profile?.username || "Okänd",
            username: profile?.username || "okand",
            avatar: profile?.avatar_url || undefined,
            status: "online" as UserStatus, // TODO: Real online status
            statusMessage: profile?.status_message || "",
          };
        });

        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    const channel = supabase
      .channel("sidebar-friends")
      .on("postgres_changes", { event: "*", schema: "public", table: "friends" }, fetchFriends)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter((f) => f.status !== "offline");
  const offlineFriends = filteredFriends.filter((f) => f.status === "offline");

  if (loading) {
    return (
      <aside className={cn("flex flex-col h-full bg-sidebar", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </aside>
    );
  }

  return (
    <aside className={cn("flex flex-col h-full bg-sidebar", className)}>
      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök vänner..."
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 input-glow transition-all"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic p-2">
        {friends.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm mb-1">🌟 Här var det tomt!</p>
            <p className="text-xs">Sök efter vänner för att komma igång.</p>
          </div>
        ) : (
          <>
            {/* Online Section */}
            <FriendsSection
              title="Online"
              count={onlineFriends.length}
              expanded={onlineExpanded}
              onToggle={() => setOnlineExpanded(!onlineExpanded)}
            >
              {onlineFriends.map((friend) => (
                <FriendItem
                  key={friend.id}
                  name={friend.name}
                  username={friend.username}
                  avatar={friend.avatar}
                  status={friend.status}
                  statusMessage={friend.statusMessage}
                  isActive={selectedFriendId === friend.id}
                  onClick={() => onSelectFriend(friend.id)}
                />
              ))}
            </FriendsSection>

            {/* Offline Section */}
            <FriendsSection
              title="Offline"
              count={offlineFriends.length}
              expanded={offlineExpanded}
              onToggle={() => setOfflineExpanded(!offlineExpanded)}
            >
              {offlineFriends.map((friend) => (
                <FriendItem
                  key={friend.id}
                  name={friend.name}
                  username={friend.username}
                  avatar={friend.avatar}
                  status={friend.status}
                  statusMessage={friend.statusMessage}
                  isActive={selectedFriendId === friend.id}
                  onClick={() => onSelectFriend(friend.id)}
                />
              ))}
            </FriendsSection>
          </>
        )}
      </div>
    </aside>
  );
}

function FriendsSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span>{title}</span>
        <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </button>
      {expanded && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}
