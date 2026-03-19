/**
 * @module ProfileFriendsTab
 * 2000s-style dense friends page with raw HTML tables.
 * No cards, no rounded modern components.
 */
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { useFriendVotes, VOTE_CATEGORIES, type VoteCategory } from "@/hooks/useFriendVotes";
import { FRIEND_CATEGORIES } from "./friends/FriendCard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import { formatTimeAgo } from "@/lib/format";

interface ProfileFriend {
  id: string;
  username: string;
  avatar_url: string | null;
  status_message: string | null;
  category: string;
  is_best_friend: boolean;
  friendshipId: string;
  age: number | null;
  gender: string | null;
  last_seen: string | null;
}

interface ProfileFriendsTabProps {
  userId: string;
}

export function ProfileFriendsTab({ userId }: ProfileFriendsTabProps) {
  const [friends, setFriends] = useState<ProfileFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getUserStatus } = usePresence();
  const { user } = useAuth();
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const { data: friendships, error } = await supabase
          .from("friends")
          .select("*")
          .eq("status", "accepted")
          .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (error) throw error;
        if (!friendships || friendships.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        const friendUserIds = friendships.map((f) =>
          f.user_id === userId ? f.friend_id : f.user_id
        );

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message, age, gender, last_seen")
          .in("user_id", friendUserIds);

        const list: ProfileFriend[] = friendships.map((f) => {
          const friendId = f.user_id === userId ? f.friend_id : f.user_id;
          const profile = profiles?.find((p) => p.user_id === friendId);
          return {
            id: friendId,
            username: profile?.username || "Okänd",
            avatar_url: profile?.avatar_url || null,
            status_message: profile?.status_message || null,
            category: f.category || "Nätvän",
            is_best_friend: f.is_best_friend,
            friendshipId: f.id,
            age: profile?.age || null,
            gender: profile?.gender || null,
            last_seen: profile?.last_seen || null,
          };
        });

        setFriends(list);
      } catch (err) {
        console.error("Error fetching profile friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [userId]);

  const bestFriends = friends.filter((f) => f.is_best_friend);

  const grouped = FRIEND_CATEGORIES.reduce<Record<string, ProfileFriend[]>>((acc, cat) => {
    const inCat = friends.filter((f) => f.category === cat);
    if (inCat.length > 0) acc[cat] = inCat;
    return acc;
  }, {});

  const handleToggleBestFriend = async (friendshipId: string, current: boolean) => {
    if (!isOwnProfile) return;
    try {
      await supabase
        .from("friends")
        .update({ is_best_friend: !current })
        .eq("id", friendshipId);
      setFriends((prev) =>
        prev.map((f) =>
          f.friendshipId === friendshipId ? { ...f, is_best_friend: !current } : f
        )
      );
    } catch (err) {
      console.error("Error toggling best friend:", err);
    }
  };

  const goToProfile = (username: string) =>
    navigate(`/profile/${encodeURIComponent(username)}`);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        🌟 Inga vänner ännu
      </p>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:gap-3 gap-4">
      {/* ── LEFT COLUMN ── */}
      <div className="flex-1 min-w-0">
        {/* BÄSTA VÄNNER */}
        <BestFriendsRow bestFriends={bestFriends} onNavigate={goToProfile} />

        {/* FRIENDS TABLE */}
        <div className="border border-primary/50 mt-2">
          {/* Table header — desktop/tablet */}
          <table className="w-full border-collapse hidden sm:table">
            <thead>
              <tr className="bg-muted/40 border-b border-primary/50">
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase px-1 py-1 w-10">Avatar</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase px-1 py-1">Användarnamn</th>
                <th className="text-center text-[11px] font-bold text-muted-foreground uppercase px-1 py-1 w-16">Online</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase px-1 py-1 w-28 hidden md:table-cell">Senast inloggad</th>
                {isOwnProfile && (
                  <th className="text-center text-[11px] font-bold text-muted-foreground uppercase px-1 py-1 w-14">Bästis</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([category, catFriends]) => (
                <CategoryGroup
                  key={category}
                  category={category}
                  friends={catFriends}
                  getUserStatus={getUserStatus}
                  isOwnProfile={isOwnProfile}
                  onNavigate={goToProfile}
                  onToggleBestFriend={handleToggleBestFriend}
                  colSpan={isOwnProfile ? 5 : 4}
                />
              ))}
            </tbody>
          </table>

          {/* Mobile list */}
          <div className="sm:hidden">
            {Object.entries(grouped).map(([category, catFriends]) => (
              <div key={category}>
                <div className="bg-primary px-2 py-1">
                  <span className="text-[11px] font-bold text-white uppercase" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>{category}</span>
                </div>
                {catFriends.map((friend) => {
                  const status = getUserStatus(friend.id);
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center gap-2 px-2 py-1 border-b border-border/30 cursor-pointer hover:bg-muted/20"
                      onClick={() => goToProfile(friend.username)}
                    >
                      <img
                        src={friend.avatar_url || "/placeholder.svg"}
                        alt={friend.username}
                        className="w-7 h-7 border border-primary/30 object-cover"
                        style={{ imageRendering: "auto" }}
                      />
                      <span className="text-xs font-medium text-foreground flex-1 truncate">
                        {friend.username}
                      </span>
                      <StatusIndicator status={status} size="sm" />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div className="lg:w-64 shrink-0">
        <PersonalityBox userId={userId} />
      </div>
    </div>
  );
}

/* ═══ BEST FRIENDS ROW ═══ */

function BestFriendsRow({
  bestFriends,
  onNavigate,
}: {
  bestFriends: ProfileFriend[];
  onNavigate: (username: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -160 : 160, behavior: "smooth" });

  return (
    <div className="border border-primary/50 p-2">
      <h3 className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
        Bästa Vänner
      </h3>
      {bestFriends.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">Inga bästa vänner markerade.</p>
      ) : (
        <div className="relative">
          {bestFriends.length > 5 && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background border border-primary/40 p-0.5"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          )}
          <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-none">
            {bestFriends.map((f) => (
              <button
                key={f.id}
                onClick={() => onNavigate(f.username)}
                className="shrink-0 flex flex-col items-center gap-1 hover:opacity-80"
              >
                <img
                  src={f.avatar_url || "/placeholder.svg"}
                  alt={f.username}
                  className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-primary object-cover"
                  style={{ imageRendering: "auto" }}
                />
                <span className="text-[10px] text-foreground font-medium truncate max-w-[64px] text-center">
                  {f.username}
                </span>
              </button>
            ))}
          </div>
          {bestFriends.length > 5 && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background border border-primary/40 p-0.5"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ CATEGORY GROUP (table rows) ═══ */

function CategoryGroup({
  category,
  friends,
  getUserStatus,
  isOwnProfile,
  onNavigate,
  onToggleBestFriend,
  colSpan,
}: {
  category: string;
  friends: ProfileFriend[];
  getUserStatus: (userId: string) => UserStatus;
  isOwnProfile: boolean;
  onNavigate: (username: string) => void;
  onToggleBestFriend: (friendshipId: string, current: boolean) => void;
  colSpan: number;
}) {
  return (
    <>
      {/* Category header row */}
      <tr>
        <td colSpan={colSpan} className="bg-primary px-2 py-1">
          <span className="text-[11px] font-bold text-white uppercase" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
            {category}
          </span>
        </td>
      </tr>
      {friends.map((friend) => {
        const status = getUserStatus(friend.id);
        const genderAge = [friend.gender, friend.age].filter(Boolean).join(", ");
        return (
          <tr
            key={friend.id}
            className="border-b border-border/20 hover:bg-muted/15"
          >
            <td className="px-1 py-1">
              <img
                src={friend.avatar_url || "/placeholder.svg"}
                alt={friend.username}
                className="w-8 h-8 border border-primary/30 cursor-pointer object-cover"
                onClick={() => onNavigate(friend.username)}
                style={{ imageRendering: "auto" }}
              />
            </td>
            <td className="px-1 py-1">
              <span
                className="text-xs font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => onNavigate(friend.username)}
              >
                {friend.username}
              </span>
              {genderAge && (
                <span className="text-[10px] text-muted-foreground ml-1">({genderAge})</span>
              )}
            </td>
            <td className="px-1 py-1 text-center">
              <div className="flex justify-center">
                <StatusIndicator status={status} size="sm" />
              </div>
            </td>
            <td className="px-1 py-1 hidden md:table-cell">
              <span className="text-[11px] text-muted-foreground">
                {friend.last_seen ? formatTimeAgo(friend.last_seen) : "–"}
              </span>
            </td>
            {isOwnProfile && (
              <td className="px-1 py-1 text-center">
                <input
                  type="checkbox"
                  checked={friend.is_best_friend}
                  onChange={() => onToggleBestFriend(friend.friendshipId, friend.is_best_friend)}
                  className="w-3.5 h-3.5 accent-[hsl(var(--primary))] cursor-pointer"
                />
              </td>
            )}
          </tr>
        );
      })}
    </>
  );
}

/* ═══ PERSONALITY BOX ═══ */

function PersonalityBox({ userId }: { userId: string }) {
  const { voteCounts, userVotes, totalVotes, toggleVote, loading } = useFriendVotes(userId);

  return (
    <div className="border border-primary/50">
      <div className="bg-primary px-2 py-1">
        <h3 className="text-[11px] font-bold text-white uppercase" style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
          Personlighet
        </h3>
      </div>
      <div className="p-2 space-y-1">
        {VOTE_CATEGORIES.map((cat) => {
          const count = voteCounts[cat] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = userVotes[cat] || false;
          return (
            <button
              key={cat}
              onClick={() => toggleVote(cat)}
              disabled={loading}
              className={cn(
                "w-full flex items-center gap-2 text-left py-0.5 hover:opacity-80 transition-opacity",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "text-[11px] w-24 shrink-0 truncate",
                voted ? "text-primary font-bold" : "text-foreground"
              )} style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}>
                {cat}
              </span>
              <div className="flex-1 h-3 bg-muted/40 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 text-right font-mono shrink-0">
                {pct}%
              </span>
            </button>
          );
        })}
        {totalVotes > 0 && (
          <p className="text-[10px] text-muted-foreground text-right pt-1">
            {totalVotes} röst{totalVotes !== 1 ? "er" : ""} totalt
          </p>
        )}
      </div>
    </div>
  );
}
