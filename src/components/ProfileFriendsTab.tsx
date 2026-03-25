/**
 * @module ProfileFriendsTab
 * 2000s-style dense friends page with raw HTML tables.
 * Uses Lunar retro design system from index.css.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
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
  const [pendingRemove, setPendingRemove] = useState<{ friendshipId: string; username: string } | null>(null);

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
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-4 text-xs">
        🌟 Inga vänner ännu
      </p>
    );
  }

  return (
    <>
    <div className="flex flex-col lg:flex-row lg:gap-2 gap-2">
      {/* ── LEFT COLUMN ── */}
      <div className="flex-1 min-w-0">
        {/* BÄSTA VÄNNER */}
        <BestFriendsRow bestFriends={bestFriends} onNavigate={goToProfile} />

        {/* FRIENDS TABLE */}
        <div className="border border-border mt-1 bg-card">
          {/* Table header — desktop/tablet */}
          <table className="w-full border-collapse hidden sm:table">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left text-[11px] font-bold text-foreground uppercase px-1 py-0.5 w-10">Bild</th>
                <th className="text-left text-[11px] font-bold text-foreground uppercase px-1 py-0.5">Namn</th>
                <th className="text-center text-[11px] font-bold text-foreground uppercase px-1 py-0.5 w-14">Status</th>
                <th className="text-left text-[11px] font-bold text-foreground uppercase px-1 py-0.5 w-24 hidden md:table-cell">Senast</th>
                {isOwnProfile && (
                  <th className="text-center text-[11px] font-bold text-foreground uppercase px-1 py-0.5 w-12">Bästis</th>
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
                <div className="lunar-box-header px-2 py-1">
                  <span className="text-[11px] font-bold uppercase">{category}</span>
                </div>
                {catFriends.map((friend, i) => {
                  const status = getUserStatus(friend.id);
                  return (
                    <div
                      key={friend.id}
                      className={cn(
                        "flex items-center gap-2 px-1 py-0.5 border-b border-border/40 hover:bg-muted/60",
                        i % 2 === 0 ? "bg-card" : "bg-muted/30"
                      )}
                    >
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() => goToProfile(friend.username)}
                      >
                        <FriendAvatar
                          src={friend.avatar_url}
                          username={friend.username}
                          size={28}
                        />
                        <span className="text-[11px] font-medium text-foreground flex-1 truncate">
                          {friend.username}
                        </span>
                        <OnlineDot status={status} />
                      </div>
                      {isOwnProfile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (friend.is_best_friend) {
                              setPendingRemove({ friendshipId: friend.friendshipId, username: friend.username });
                            } else {
                              handleToggleBestFriend(friend.friendshipId, false);
                            }
                          }}
                          className="p-1 shrink-0"
                          title={friend.is_best_friend ? "Ta bort som bästis" : "Lägg till som bästis"}
                        >
                          <input
                            type="checkbox"
                            checked={friend.is_best_friend}
                            readOnly
                            className="w-3.5 h-3.5 accent-[hsl(var(--primary))] cursor-pointer pointer-events-none"
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div className="lg:w-56 shrink-0">
        <PersonalityBox userId={userId} isOwnProfile={isOwnProfile} />
      </div>
    </div>

      {/* Confirmation dialog for removing best friend on mobile */}
      <AlertDialog open={!!pendingRemove} onOpenChange={(open) => { if (!open) setPendingRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort som bästis?</AlertDialogTitle>
            <AlertDialogDescription>
              Vill du ta bort {pendingRemove?.username} som bästis?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingRemove) {
                handleToggleBestFriend(pendingRemove.friendshipId, true);
                setPendingRemove(null);
              }
            }}>
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ═══ FRIEND AVATAR ═══ */

function FriendAvatar({
  src,
  username,
  size = 28,
  className = "",
  onClick,
}: {
  src: string | null;
  username: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const initial = (username || "?")[0].toUpperCase();
  const showImg = !!src && !failed;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center border border-border bg-muted text-foreground font-bold shrink-0 overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {/* Always render the letter as fallback layer */}
      {(!showImg || !loaded) && <span>{initial}</span>}
      {/* Render img on top if src exists */}
      {showImg && (
        <img
          src={src}
          alt={username}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
}

/* ═══ ONLINE DOT (10px circle) ═══ */

function OnlineDot({ status }: { status: UserStatus }) {
  return (
    <span
      className={cn(
        "inline-block w-[10px] h-[10px] rounded-full shrink-0",
        status === "online" ? "bg-green-500" : "bg-muted-foreground/40"
      )}
    />
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
    <div className="border border-border bg-card">
      <div className="lunar-box-header px-2 py-1">
        <h3 className="text-[11px] font-bold uppercase">
          ⭐ Bästa Vänner
        </h3>
      </div>
      <div className="p-1.5">
        {bestFriends.length === 0 ? (
          <p className="text-[10px] text-muted-foreground px-1">Inga bästa vänner markerade.</p>
        ) : (
          <div className="relative">
            {bestFriends.length > 5 && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card border border-border p-0.5"
              >
                <ChevronLeft className="w-3 h-3 text-primary" />
              </button>
            )}
            <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {bestFriends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onNavigate(f.username)}
                  className="shrink-0 flex flex-col items-center gap-0.5 hover:opacity-80"
                >
                  <FriendAvatar
                    src={f.avatar_url}
                    username={f.username}
                    size={64}
                    className="border-2 !border-primary"
                  />
                  <span className="text-[10px] text-foreground font-medium truncate max-w-[64px] text-center leading-tight">
                    {f.username}
                  </span>
                </button>
              ))}
            </div>
            {bestFriends.length > 5 && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card border border-border p-0.5"
              >
                <ChevronRight className="w-3 h-3 text-primary" />
              </button>
            )}
          </div>
        )}
      </div>
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
      {/* Category header row — uses lunar-box-header gradient */}
      <tr>
        <td colSpan={colSpan} className="lunar-box-header px-2 py-0.5">
          <span className="text-[11px] font-bold uppercase">
            {category}
          </span>
        </td>
      </tr>
      {friends.map((friend, i) => {
        const status = getUserStatus(friend.id);
        const genderAge = [friend.gender, friend.age].filter(Boolean).join(", ");
        return (
          <tr
            key={friend.id}
            className={cn(
              "border-b border-border/30 hover:bg-muted/50",
              i % 2 === 0 ? "bg-card" : "bg-muted/25"
            )}
          >
            <td className="px-1 py-0.5">
              <FriendAvatar
                src={friend.avatar_url}
                username={friend.username}
                size={28}
                onClick={() => onNavigate(friend.username)}
              />
            </td>
            <td className="px-1 py-0.5">
              <span
                className="text-[11px] font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => onNavigate(friend.username)}
              >
                {friend.username}
              </span>
              {genderAge && (
                <span className="text-[10px] text-muted-foreground ml-1">({genderAge})</span>
              )}
            </td>
            <td className="px-1 py-0.5 text-center">
              <div className="flex justify-center">
                <OnlineDot status={status} />
              </div>
            </td>
            <td className="px-1 py-0.5 hidden md:table-cell">
              <span className="text-[10px] text-muted-foreground">
                {friend.last_seen ? formatTimeAgo(friend.last_seen) : "–"}
              </span>
            </td>
            {isOwnProfile && (
              <td className="px-1 py-0.5 text-center">
                <input
                  type="checkbox"
                  checked={friend.is_best_friend}
                  onChange={() => onToggleBestFriend(friend.friendshipId, friend.is_best_friend)}
                  className="w-3 h-3 accent-[hsl(var(--primary))] cursor-pointer"
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

function PersonalityBox({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const { voteCounts, userVotes, totalVotes, toggleVote, loading } = useFriendVotes(userId);

  return (
    <div className="border border-border bg-card">
      <div className="lunar-box-header px-2 py-1">
        <h3 className="text-[11px] font-bold uppercase">
          🎭 Personlighet
        </h3>
      </div>
      <div className="p-1.5 space-y-0.5">
        {VOTE_CATEGORIES.map((cat) => {
          const count = voteCounts[cat] || 0;
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          const voted = userVotes[cat] || false;
          return (
            <button
              key={cat}
              onClick={() => !isOwnProfile && toggleVote(cat)}
              disabled={loading || isOwnProfile}
              className={cn(
                "w-full flex items-center gap-1.5 text-left py-px hover:opacity-80 transition-opacity",
                (loading || isOwnProfile) && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "text-[10px] w-20 shrink-0 truncate leading-tight",
                voted ? "text-primary font-bold" : "text-foreground"
              )}>
                {cat}
              </span>
              <div className="flex-1 h-2.5 bg-muted/50 border border-border/40 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: "linear-gradient(to bottom, #d8613e 0%, #d15234 24%, #b9180e 82%, #b40c06 100%)",
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground w-7 text-right font-mono shrink-0">
                {pct}%
              </span>
            </button>
          );
        })}
        <p className="text-[9px] text-muted-foreground text-right pt-0.5">
          {totalVotes} röst{totalVotes !== 1 ? "er" : ""} totalt
        </p>
      </div>
    </div>
  );
}
