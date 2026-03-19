import { useState, useEffect } from "react";
import { Star, Loader2, UserPlus, MessageSquare, UserMinus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePresence } from "@/hooks/usePresence";
import { PersonalityMeter } from "../PersonalityMeter";
import { useFriendVotes } from "@/hooks/useFriendVotes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { UserStatus } from "../StatusIndicator";

export const FRIEND_CATEGORIES = [
  "Nätvän",
  "Polare",
  "Granne",
  "Pussgurka",
  "Kollega",
  "Klasskamrat",
  "Beundrare",
] as const;

export type FriendCategory = (typeof FRIEND_CATEGORIES)[number];

export interface FriendData {
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
  category: FriendCategory;
  lastSeen?: string;
}

interface FriendsListProps {
  onSendMessage?: (userId: string) => void;
}

// PersonalityMeter wrapper for selected friend
function SelectedFriendPersonality({ friendId }: { friendId: string }) {
  const { voteCounts, userVotes, totalVotes, toggleVote, loading } = useFriendVotes(friendId);
  const { user } = useAuth();
  return (
    <PersonalityMeter
      voteCounts={voteCounts}
      userVotes={userVotes}
      totalVotes={totalVotes}
      onToggleVote={toggleVote}
      disabled={!user}
      loading={loading}
    />
  );
}

function formatLastSeen(lastSeen?: string): string {
  if (!lastSeen) return "–";
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 3) return "online nu";
  if (diffMin < 60) return `${diffMin} min sedan`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h sedan`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "igår";
  return `${diffD} dagar sedan`;
}

export function FriendsList({ onSendMessage }: FriendsListProps) {
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "online" | "best">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getUserStatus } = usePresence();
  const isLoggedOut = !authLoading && !user;

  useEffect(() => {
    if (isLoggedOut || !user) {
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
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (error) throw error;
        if (!friendships || friendships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendUserIds = friendships.map((f) => (f.user_id === user.id ? f.friend_id : f.user_id));

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message, last_seen")
          .in("user_id", friendUserIds);

        const friendsList: FriendData[] = friendships.map((friendship) => {
          const friendUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
          const profile = profiles?.find((p) => p.user_id === friendUserId);
          const isIncoming = friendship.friend_id === user.id && friendship.status === "pending";

          let status: UserStatus = getUserStatus(friendUserId);
          if (status === "offline" && profile?.last_seen) {
            const lastSeenMs = new Date(profile.last_seen).getTime();
            const now = Date.now();
            if (lastSeenMs > now - 3 * 60 * 1000) status = "online";
            else if (lastSeenMs > now - 8 * 60 * 1000) status = "away";
          }

          return {
            id: friendUserId,
            name: profile?.username || "Okänd",
            username: profile?.username || "okand",
            avatar: profile?.avatar_url || undefined,
            status,
            statusMessage: profile?.status_message || "",
            isBestFriend: friendship.is_best_friend,
            friendshipId: friendship.id,
            friendshipStatus: friendship.status,
            isIncoming,
            category: (friendship.category || "Nätvän") as FriendCategory,
            lastSeen: profile?.last_seen,
          };
        });

        setFriends(friendsList);
      } catch (error) {
        console.error("Error fetching friends:", error);
        toast({ title: "Kunde inte hämta vänner", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    const channel = supabase
      .channel("friends-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friends" }, fetchFriends)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoggedOut, toast]);

  const handleToggleBestFriend = async (friendshipId: string, current: boolean) => {
    if (!user) return;
    setActionLoading(friendshipId);
    try {
      const { error } = await supabase.from("friends").update({ is_best_friend: !current }).eq("id", friendshipId);
      if (error) throw error;
      setFriends((prev) => prev.map((f) => (f.friendshipId === friendshipId ? { ...f, isBestFriend: !current } : f)));
    } catch {
      toast({ title: "Kunde inte ändra bästis", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    if (!user) return;
    setActionLoading(friendshipId);
    try {
      const { error } = await supabase.from("friends").delete().eq("id", friendshipId);
      if (error) throw error;
      toast({ title: "Vän borttagen" });
    } catch {
      toast({ title: "Kunde inte ta bort vän", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCategoryChange = async (friendshipId: string, newCategory: string) => {
    try {
      const { error } = await supabase.from("friends").update({ category: newCategory }).eq("id", friendshipId);
      if (error) throw error;
      setFriends((prev) =>
        prev.map((f) => (f.friendshipId === friendshipId ? { ...f, category: newCategory as FriendCategory } : f)),
      );
    } catch {
      toast({ title: "Kunde inte ändra kategori", variant: "destructive" });
    }
  };

  const acceptedFriends = friends.filter((f) => f.friendshipStatus === "accepted");
  const pendingFriends = friends.filter((f) => f.friendshipStatus === "pending" && f.isIncoming);
  const bestFriends = acceptedFriends.filter((f) => f.isBestFriend).slice(0, 5);
  const onlineCount = acceptedFriends.filter((f) => f.status !== "offline").length;

  const filteredFriends = acceptedFriends.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "online") return matchSearch && f.status !== "offline";
    if (filter === "best") return matchSearch && f.isBestFriend;
    return matchSearch;
  });

  const grouped = FRIEND_CATEGORIES.reduce<Record<string, FriendData[]>>((acc, cat) => {
    const inCat = filteredFriends.filter((f) => f.category === cat);
    if (inCat.length > 0) acc[cat] = inCat;
    return acc;
  }, {});

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);

  if (isLoggedOut) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground mb-4">Logga in för att se dina vänner</p>
        <button
          onClick={() => navigate("/auth")}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-sm uppercase"
        >
          Logga in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif" }}>
      {/* ── HEADER ── */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "12px 16px",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <div>
          <span style={{ fontWeight: "bold", fontSize: "14px", color: "var(--primary)" }}>👥 MINA VÄNNER</span>
          <span style={{ fontSize: "12px", color: "var(--muted-foreground)", marginLeft: "12px" }}>
            {onlineCount} av {acceptedFriends.length} online just nu
          </span>
        </div>
        <button
          onClick={() => navigate("/?tab=sok")}
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "bold",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <UserPlus size={12} /> Hitta vänner
        </button>
      </div>

      {/* ── BÄSTA VÄNNER ── */}
      {bestFriends.length > 0 && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            padding: "10px 14px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "10px",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "6px",
            }}
          >
            ⭐ Bästa Vänner
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {bestFriends.map((friend) => (
              <div
                key={friend.id}
                style={{ textAlign: "center", cursor: "pointer" }}
                onClick={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
              >
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={friend.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`}
                    alt={friend.name}
                    style={{
                      width: "56px",
                      height: "56px",
                      objectFit: "cover",
                      border: "2px solid var(--primary)",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      right: "2px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background:
                        friend.status === "online" ? "#22c55e" : friend.status === "away" ? "#f59e0b" : "#6b7280",
                      border: "1px solid var(--background)",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    marginTop: "4px",
                    color: "var(--foreground)",
                    maxWidth: "60px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {friend.name}
                </div>
                <div style={{ fontSize: "10px", color: "var(--primary)" }}>
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${encodeURIComponent(friend.username)}`);
                    }}
                  >
                    Profil
                  </span>
                  {" · "}
                  <span
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${encodeURIComponent(friend.username)}?tab=gastbok`);
                    }}
                  >
                    Gästbok
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SÖKBAR + FILTER ── */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          padding: "8px 14px",
          marginBottom: "8px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sök vän..."
          style={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            padding: "3px 8px",
            fontSize: "12px",
            width: "150px",
          }}
        />
        {(["all", "online", "best"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: "bold",
              cursor: "pointer",
              background: filter === f ? "var(--primary)" : "var(--muted)",
              color: filter === f ? "var(--primary-foreground)" : "var(--muted-foreground)",
              border: "none",
              textTransform: "uppercase",
            }}
          >
            {f === "all"
              ? `Alla (${acceptedFriends.length})`
              : f === "online"
                ? `Online (${onlineCount})`
                : "⭐ Bästisar"}
          </button>
        ))}
        {pendingFriends.length > 0 && (
          <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "bold" }}>
            {pendingFriends.length} förfrågan(ar) väntar
          </span>
        )}
      </div>

      {/* ── MAIN TWO-COLUMN LAYOUT ── */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        {/* LEFT: Friends table */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <Loader2 className="animate-spin" style={{ margin: "0 auto", color: "var(--primary)" }} />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                padding: "32px",
                textAlign: "center",
                color: "var(--muted-foreground)",
                fontSize: "13px",
              }}
            >
              {acceptedFriends.length === 0 ? "Inga vänner ännu — sök efter folk!" : "Inga vänner hittades"}
            </div>
          ) : (
            Object.entries(grouped).map(([category, catFriends]) => (
              <div key={category} style={{ marginBottom: "4px" }}>
                {/* Category header */}
                <div
                  style={{
                    background: "var(--primary)",
                    color: "var(--primary-foreground)",
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {category} ({catFriends.length})
                </div>

                {/* Table header */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      <th
                        style={{
                          padding: "3px 8px",
                          textAlign: "left",
                          fontWeight: "bold",
                          fontSize: "10px",
                          color: "var(--muted-foreground)",
                          width: "32px",
                        }}
                      ></th>
                      <th
                        style={{
                          padding: "3px 8px",
                          textAlign: "left",
                          fontWeight: "bold",
                          fontSize: "10px",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        Användarnamn
                      </th>
                      <th
                        style={{
                          padding: "3px 8px",
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "10px",
                          color: "var(--muted-foreground)",
                          width: "60px",
                        }}
                      >
                        Online
                      </th>
                      <th
                        style={{
                          padding: "3px 8px",
                          textAlign: "left",
                          fontWeight: "bold",
                          fontSize: "10px",
                          color: "var(--muted-foreground)",
                          width: "110px",
                        }}
                        className="hidden md:table-cell"
                      >
                        Senast inloggad
                      </th>
                      <th
                        style={{
                          padding: "3px 8px",
                          textAlign: "center",
                          fontWeight: "bold",
                          fontSize: "10px",
                          color: "var(--muted-foreground)",
                          width: "90px",
                        }}
                      >
                        Åtgärd
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {catFriends.map((friend, idx) => (
                      <tr
                        key={friend.id}
                        style={{
                          background:
                            selectedFriendId === friend.id
                              ? "rgba(var(--primary-rgb, 249,115,22), 0.1)"
                              : idx % 2 === 0
                                ? "var(--card)"
                                : "var(--muted)",
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedFriendId(selectedFriendId === friend.id ? null : friend.id)}
                      >
                        {/* Avatar */}
                        <td style={{ padding: "4px 6px" }}>
                          <div style={{ position: "relative", display: "inline-block" }}>
                            <img
                              src={friend.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`}
                              alt={friend.name}
                              style={{
                                width: "24px",
                                height: "24px",
                                objectFit: "cover",
                                border: "1px solid var(--border)",
                                display: "block",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${encodeURIComponent(friend.username)}`);
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: "0",
                                right: "0",
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background:
                                  friend.status === "online"
                                    ? "#22c55e"
                                    : friend.status === "away"
                                      ? "#f59e0b"
                                      : "#6b7280",
                                border: "1px solid var(--background)",
                              }}
                            />
                          </div>
                        </td>

                        {/* Name */}
                        <td style={{ padding: "4px 8px" }}>
                          <span
                            style={{ fontWeight: "bold", color: "var(--primary)", cursor: "pointer", fontSize: "12px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/profile/${encodeURIComponent(friend.username)}`);
                            }}
                          >
                            {friend.name}
                          </span>
                          {friend.isBestFriend && (
                            <Star
                              size={10}
                              style={{ display: "inline", marginLeft: "4px", color: "#eab308", fill: "#eab308" }}
                            />
                          )}
                          {friend.statusMessage && (
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--muted-foreground)",
                                fontStyle: "italic",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "160px",
                              }}
                            >
                              {friend.statusMessage}
                            </div>
                          )}
                        </td>

                        {/* Online status */}
                        <td style={{ padding: "4px 8px", textAlign: "center" }}>
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background:
                                friend.status === "online"
                                  ? "#22c55e"
                                  : friend.status === "away"
                                    ? "#f59e0b"
                                    : "#6b7280",
                              margin: "0 auto",
                            }}
                            title={
                              friend.status === "online" ? "Online" : friend.status === "away" ? "Borta" : "Offline"
                            }
                          />
                        </td>

                        {/* Last seen - hidden on mobile */}
                        <td
                          style={{ padding: "4px 8px", fontSize: "11px", color: "var(--muted-foreground)" }}
                          className="hidden md:table-cell"
                        >
                          {formatLastSeen(friend.lastSeen)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "4px 6px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button
                              title="Skicka meddelande"
                              onClick={() => onSendMessage?.(friend.id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--primary)",
                                padding: "2px",
                              }}
                            >
                              <MessageSquare size={13} />
                            </button>
                            <button
                              title={friend.isBestFriend ? "Ta bort bästis" : "Markera som bästis"}
                              onClick={() => handleToggleBestFriend(friend.friendshipId, friend.isBestFriend)}
                              disabled={actionLoading === friend.friendshipId}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: friend.isBestFriend ? "#eab308" : "var(--muted-foreground)",
                                padding: "2px",
                              }}
                            >
                              <Star size={13} style={{ fill: friend.isBestFriend ? "#eab308" : "none" }} />
                            </button>
                            <button
                              title="Ta bort vän"
                              onClick={() => handleRemove(friend.friendshipId)}
                              disabled={actionLoading === friend.friendshipId}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "var(--muted-foreground)",
                                padding: "2px",
                              }}
                            >
                              <UserMinus size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Expanded friend details */}
                {selectedFriend && catFriends.some((f) => f.id === selectedFriendId) && (
                  <div
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--primary)",
                      padding: "10px 14px",
                      fontSize: "12px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div>
                        <span style={{ color: "var(--muted-foreground)", fontSize: "11px" }}>Kategori: </span>
                        <Select
                          defaultValue={selectedFriend.category}
                          onValueChange={(val) => handleCategoryChange(selectedFriend.friendshipId, val)}
                        >
                          <SelectTrigger
                            style={{ height: "24px", width: "130px", fontSize: "11px", display: "inline-flex" }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FRIEND_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} style={{ fontSize: "11px" }}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Pending friend requests */}
          {pendingFriends.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div
                style={{
                  background: "#f59e0b",
                  color: "#000",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Väntande förfrågningar ({pendingFriends.length})
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <tbody>
                  {pendingFriends.map((friend) => (
                    <tr key={friend.id} style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 8px" }}>
                        <img
                          src={friend.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`}
                          alt={friend.name}
                          style={{ width: "24px", height: "24px", border: "1px solid var(--border)" }}
                        />
                      </td>
                      <td style={{ padding: "6px 8px", fontWeight: "bold", color: "var(--primary)" }}>{friend.name}</td>
                      <td style={{ padding: "6px 8px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={async () => {
                              await supabase
                                .from("friends")
                                .update({ status: "accepted" })
                                .eq("id", friend.friendshipId);
                              toast({ title: "Vänförfrågan accepterad!" });
                            }}
                            style={{
                              background: "#22c55e",
                              color: "#fff",
                              border: "none",
                              padding: "2px 8px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            ✓ Acceptera
                          </button>
                          <button
                            onClick={async () => {
                              await supabase.from("friends").delete().eq("id", friend.friendshipId);
                              toast({ title: "Avvisad" });
                            }}
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              padding: "2px 8px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            ✕ Avböj
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT: Personlighet sidebar (desktop only) */}
        <div style={{ width: "200px", flexShrink: 0 }} className="hidden lg:block">
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Personlighet
            </div>
            <div style={{ padding: "10px" }}>
              {selectedFriend ? (
                <>
                  <div style={{ fontSize: "11px", color: "var(--muted-foreground)", marginBottom: "8px" }}>
                    Vad tycker vänner om <strong style={{ color: "var(--primary)" }}>{selectedFriend.name}</strong>?
                  </div>
                  <SelectedFriendPersonality friendId={selectedFriend.id} />
                </>
              ) : (
                <div style={{ fontSize: "11px", color: "var(--muted-foreground)", fontStyle: "italic" }}>
                  Klicka på en vän för att se personlighetsmätaren
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: Personlighet below list */}
      {selectedFriend && (
        <div style={{ marginTop: "8px" }} className="lg:hidden">
          <div style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              Personlighet — {selectedFriend.name}
            </div>
            <div style={{ padding: "10px" }}>
              <SelectedFriendPersonality friendId={selectedFriend.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
