import { useState, useEffect } from "react";
import { Search, UserPlus, MessageSquare, Star, Info, Check, X, Loader2, UserMinus } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  isBestFriend: boolean;
  friendshipId: string;
  friendshipStatus: string;
  isIncoming: boolean;
}

// No demo data - only real users from database

interface FriendsListProps {
  onSendMessage?: (userId: string) => void;
}

export function FriendsList({ onSendMessage }: FriendsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "best" | "pending">("all");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLoggedOut = !authLoading && !user;

  // Fetch friends from database
  useEffect(() => {
    if (isLoggedOut || !user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      setLoading(true);
      try {
        // Get all friendships where user is involved
        const { data: friendships, error } = await supabase
          .from("friends")
          .select("*")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) throw error;

        if (!friendships || friendships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        // Get all friend user IDs
        const friendUserIds = friendships.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        // Fetch profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message")
          .in("user_id", friendUserIds);

        if (profilesError) throw profilesError;

        // Map profiles to friends
        const friendsList: Friend[] = friendships.map((friendship) => {
          const friendUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
          const profile = profiles?.find((p) => p.user_id === friendUserId);
          const isIncoming = friendship.friend_id === user.id && friendship.status === "pending";

          return {
            id: friendUserId,
            name: profile?.username || "Okänd",
            username: profile?.username || "okand",
            avatar: profile?.avatar_url || undefined,
            status: "online" as UserStatus, // TODO: Real online status
            statusMessage: profile?.status_message || "",
            isBestFriend: friendship.is_best_friend,
            friendshipId: friendship.id,
            friendshipStatus: friendship.status,
            isIncoming,
          };
        });

        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({
          title: "Kunde inte hämta vänner",
          description: "Försök igen senare",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("friends-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friends",
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoggedOut, toast]);

  const handleAccept = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);

    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Vänförfrågan accepterad!",
        description: "Ni är nu vänner",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Kunde inte acceptera",
        description: "Försök igen",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);

    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Vänförfrågan avvisad",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "Kunde inte avvisa",
        description: "Försök igen",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBestFriend = async (friendshipId: string, currentValue: boolean) => {
    if (!user) return;
    setActionLoading(friendshipId);

    try {
      const { error } = await supabase
        .from("friends")
        .update({ is_best_friend: !currentValue })
        .eq("id", friendshipId);

      if (error) throw error;

      setFriends((prev) =>
        prev.map((f) =>
          f.friendshipId === friendshipId ? { ...f, isBestFriend: !currentValue } : f
        )
      );
    } catch (error) {
      console.error("Error toggling best friend:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);

    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Vän borttagen",
      });
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: "Kunde inte ta bort vän",
        description: "Försök igen",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "online") return matchesSearch && friend.status !== "offline" && friend.friendshipStatus === "accepted";
    if (filter === "best") return matchesSearch && friend.isBestFriend && friend.friendshipStatus === "accepted";
    if (filter === "pending") return matchesSearch && friend.friendshipStatus === "pending" && friend.isIncoming;
    if (filter === "all") return matchesSearch && friend.friendshipStatus === "accepted";
    return matchesSearch;
  });

  const onlineCount = friends.filter((f) => f.status !== "offline" && f.friendshipStatus === "accepted").length;
  const acceptedCount = friends.filter((f) => f.friendshipStatus === "accepted").length;
  const pendingCount = friends.filter((f) => f.friendshipStatus === "pending" && f.isIncoming).length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Login prompt for logged out users */}
        {isLoggedOut && (
          <div className="nostalgia-card p-3 mb-4 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <button onClick={() => navigate("/auth")} className="text-primary hover:underline font-medium">Logga in</button> för att se och hantera dina vänner!
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-xl mb-1">👥 Mina Vänner</h1>
              <p className="text-sm text-muted-foreground">
                {acceptedCount > 0
                  ? `${onlineCount} av ${acceptedCount} online just nu`
                  : "Du har inga vänner ännu"}
              </p>
            </div>
            {!isLoggedOut ? (
              <Button variant="msn" onClick={() => navigate("/?tab=sok")}>
                <UserPlus className="w-4 h-4 mr-2" />
                Hitta vänner
              </Button>
            ) : (
              <Button variant="msn" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök bland vänner..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Alla ({acceptedCount})
          </button>
          <button
            onClick={() => setFilter("online")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
              filter === "online"
                ? "bg-online text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Online ({onlineCount})
          </button>
          <button
            onClick={() => setFilter("best")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1",
              filter === "best"
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <Star className="w-3 h-3" />
            Bästa vänner
          </button>
          {pendingCount > 0 && (
            <button
              onClick={() => setFilter("pending")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
                filter === "pending"
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              Förfrågningar ({pendingCount})
            </button>
          )}
        </div>

        {/* Loading state */}
        {loading && !isLoggedOut && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Friends list */}
        {!loading && (
          <div className="nostalgia-card overflow-hidden divide-y divide-border">
            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg mb-2">🌟 Här var det tomt!</p>
                {friends.length === 0 && !isLoggedOut ? (
                  <p className="text-sm">Sök efter vänner för att komma igång.</p>
                ) : filter === "pending" ? (
                  <p className="text-sm">Inga väntande vänförfrågningar</p>
                ) : (
                  <p className="text-sm">Inga vänner hittades</p>
                )}
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
                  >
                    <Avatar name={friend.name} src={friend.avatar} status={friend.status} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
                      >
                        {friend.name}
                      </span>
                      {friend.isBestFriend && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusIndicator status={friend.status} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {friend.statusMessage || friend.status}
                      </span>
                    </div>
                  </div>

                  {/* Pending actions */}
                  {friend.friendshipStatus === "pending" && friend.isIncoming ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={() => handleAccept(friend.friendshipId)}
                        disabled={actionLoading === friend.friendshipId}
                      >
                        {actionLoading === friend.friendshipId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleReject(friend.friendshipId)}
                        disabled={actionLoading === friend.friendshipId}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isLoggedOut}
                        onClick={() => onSendMessage?.(friend.id)}
                        title="Skicka meddelande"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          friend.isBestFriend && "text-yellow-500"
                        )}
                        disabled={isLoggedOut}
                        onClick={() => handleToggleBestFriend(friend.friendshipId, friend.isBestFriend)}
                        title={friend.isBestFriend ? "Ta bort som bästis" : "Markera som bästis"}
                      >
                        <Star className={cn("w-4 h-4", friend.isBestFriend && "fill-current")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={isLoggedOut}
                        onClick={() => handleRemoveFriend(friend.friendshipId)}
                        title="Ta bort vän"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
