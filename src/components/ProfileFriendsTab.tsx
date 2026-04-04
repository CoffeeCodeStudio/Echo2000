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
import { CATEGORY_EMOJIS } from "./PersonalityMeter";
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
  // Map of friendUserId → voted emoji (the current user's vote on each friend)
  const [friendEmojis, setFriendEmojis] = useState<Record<string, string>>({});

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
      <p className="text-center text-muted-foreground py-8 text-sm">
        🌟 Inga vänner ännu
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3">
        {/* ── LEFT COLUMN ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* BÄSTA VÄNNER */}
          <BestFriendsRow bestFriends={bestFriends} onNavigate={goToProfile} />

          {/* FRIENDS TABLE */}
          <div className="border border-[hsl(var(--lunar-box-border))] bg-card overflow-hidden">
            {/* Table — desktop/tablet */}
            <table className="w-full border-collapse hidden sm:table">
              <thead>
                <tr className="lunar-box-header">
                  <th className="text-left text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1.5 w-14">Avatar</th>
                  <th className="text-left text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1.5">Användarnamn</th>
                  <th className="text-center text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1.5 w-16">Online</th>
                  <th className="text-left text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1.5 w-28 hidden md:table-cell">Senast inloggad</th>
                  {isOwnProfile && (
                    <th className="text-center text-[10px] font-bold text-white uppercase tracking-wide px-3 py-1.5 w-14">Bästis</th>
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
                  <div className="lunar-box-header px-3 py-1.5">
                    <span className="text-xs font-bold uppercase">{category}</span>
                  </div>
                  {catFriends.map((friend, i) => {
                    const status = getUserStatus(friend.id);
                    return (
                      <div
                        key={friend.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 border-b border-border/30",
                          i % 2 === 0 ? "bg-card" : "bg-muted/20"
                        )}
                      >
                        <div
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => goToProfile(friend.username)}
                        >
                          <FriendAvatar
                            src={friend.avatar_url}
                            username={friend.username}
                            size={36}
                          />
                          <span className="text-xs font-medium text-foreground flex-1 truncate">
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
                              className="w-4 h-4 accent-[hsl(var(--primary))] cursor-pointer pointer-events-none"
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
        <div className="lg:w-64 shrink-0">
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
  size = 36,
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
        "relative flex items-center justify-center border border-border bg-muted text-foreground font-bold shrink-0 overflow-hidden rounded-sm",
        onClick && "cursor-pointer",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {(!showImg || !loaded) && <span>{initial}</span>}
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
        "inline-block w-2.5 h-2.5 rounded-full shrink-0",
        status === "online" ? "bg-green-500" : "bg-muted-foreground/30"
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
    scrollRef.current?.scrollBy({ left: dir === "left" ? -180 : 180, behavior: "smooth" });

  return (
    <div className="border border-[hsl(var(--lunar-box-border))] bg-card overflow-hidden">
      <div className="lunar-box-header px-3 py-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wide">
          Bästa Vänner
        </h3>
      </div>
      <div className="p-3">
        {bestFriends.length === 0 ? (
          <p className="text-xs text-muted-foreground">Inga bästa vänner markerade.</p>
        ) : (
          <div className="relative">
            {bestFriends.length > 5 && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-border p-1 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-primary" />
              </button>
            )}
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-none px-1">
              {bestFriends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onNavigate(f.username)}
                  className="shrink-0 flex flex-col items-center gap-1 hover:bg-[#fff3e6] p-1 transition-colors"
                >
                  <FriendAvatar
                    src={f.avatar_url}
                    username={f.username}
                    size={72}
                    className="border-2 !border-primary rounded-sm"
                  />
                  <span className="text-[11px] text-foreground font-medium truncate max-w-[72px] text-center leading-tight">
                    {f.username}
                  </span>
                </button>
              ))}
            </div>
            {bestFriends.length > 5 && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/90 border border-border p-1 hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-primary" />
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
      {/* Category header row */}
      <tr>
        <td colSpan={colSpan} className="lunar-box-header px-3 py-1.5">
          <span className="text-xs font-bold uppercase tracking-wide">
            {category}
          </span>
        </td>
      </tr>
      {friends.map((friend, i) => {
        const status = getUserStatus(friend.id);
        return (
          <tr
            key={friend.id}
            className={cn(
              "border-b border-border/20 transition-colors cursor-pointer",
              "hover:bg-[#fff3e6]",
              i % 2 === 0 ? "bg-card" : "bg-muted/15"
            )}
          >
            <td className="px-3 py-1.5">
              <FriendAvatar
                src={friend.avatar_url}
                username={friend.username}
                size={36}
                onClick={() => onNavigate(friend.username)}
              />
            </td>
            <td className="px-3 py-1.5">
              <span
                className="text-[11px] font-bold text-foreground cursor-pointer hover:text-[#ff6600] transition-colors"
                onClick={() => onNavigate(friend.username)}
              >
                {friend.username}
              </span>
            </td>
            <td className="px-3 py-1.5 text-center">
              <div className="flex justify-center">
                <OnlineDot status={status} />
              </div>
            </td>
            <td className="px-3 py-1.5 hidden md:table-cell">
              <span className="text-[11px] text-muted-foreground">
                {friend.last_seen ? formatTimeAgo(friend.last_seen) : "–"}
              </span>
            </td>
            {isOwnProfile && (
              <td className="px-3 py-1.5 text-center">
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

function PersonalityBox({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) {
  const { voteCounts, userVotes, totalVotes, toggleVote, loading } = useFriendVotes(userId);

  return (
    <div className="border border-[hsl(var(--lunar-box-border))] bg-card overflow-hidden">
      <div className="lunar-box-header px-3 py-1.5">
        <h3 className="text-xs font-bold uppercase tracking-wide">
          Personlighet
        </h3>
      </div>
      <div className="p-3 space-y-2">
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
                "w-full flex items-center gap-2 text-left hover:opacity-80 transition-opacity",
                (loading || isOwnProfile) && "opacity-60 cursor-not-allowed"
              )}
            >
              <span className={cn(
                "text-[11px] w-16 shrink-0 truncate",
                voted ? "text-primary font-bold" : "text-foreground"
              )}>
                {cat}
              </span>
              <div className="flex-1 h-3.5 bg-muted/40 border border-border/30 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: "linear-gradient(to right, #ff6600, #ff8533)",
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 text-right font-mono shrink-0">
                {pct}%
              </span>
            </button>
          );
        })}
        <p className="text-[10px] text-muted-foreground text-right pt-1">
          {totalVotes} röst{totalVotes !== 1 ? "er" : ""} totalt
        </p>
      </div>
    </div>
  );
}
