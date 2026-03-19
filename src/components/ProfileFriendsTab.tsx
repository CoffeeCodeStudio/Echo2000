/**
 * @module ProfileFriendsTab
 * StajlPlejs-inspired friends tab with two-column desktop layout:
 * LEFT: Best friends + categorized friends table
 * RIGHT: Personality meter sidebar
 * Responsive: tablet collapses sidebar below, mobile uses simple list.
 */
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { PersonalityMeter } from "./PersonalityMeter";
import { useFriendVotes } from "@/hooks/useFriendVotes";
import { FRIEND_CATEGORIES } from "./friends/FriendCard";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import { formatTimeAgo } from "@/lib/format";
import { Checkbox } from "./ui/checkbox";

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

  // Group by category
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
    <div className="flex flex-col lg:flex-row gap-4">
      {/* LEFT: Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Bästa Vänner */}
        <BestFriendsSection
          bestFriends={bestFriends}
          onNavigate={(username) => navigate(`/profile/${encodeURIComponent(username)}`)}
        />

        {/* Friends table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Table header - hidden on mobile */}
          <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
            <span className="w-9">Avatar</span>
            <span>Användarnamn</span>
            <span className="w-16 text-center">Online</span>
            <span className="w-28 text-center hidden md:block lg:block">Senast inloggad</span>
            {isOwnProfile && <span className="w-14 text-center">Bästis</span>}
          </div>

          {Object.entries(grouped).map(([category, categoryFriends]) => (
            <div key={category}>
              {/* Category header */}
              <div className="px-3 py-1.5 bg-primary/15 border-y border-primary/30">
                <span className="text-sm font-bold text-primary">{category}</span>
                <span className="ml-2 text-xs text-muted-foreground">({categoryFriends.length})</span>
              </div>

              {/* Friends in category */}
              {categoryFriends.map((friend) => (
                <FriendRow
                  key={friend.id}
                  friend={friend}
                  getUserStatus={getUserStatus}
                  isOwnProfile={isOwnProfile}
                  onNavigate={() => navigate(`/profile/${encodeURIComponent(friend.username)}`)}
                  onToggleBestFriend={handleToggleBestFriend}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR (desktop) / BOTTOM (tablet/mobile) */}
      <div className="lg:w-72 shrink-0">
        <PersonalityBox userId={userId} />
      </div>
    </div>
  );
}

/* ─── Best Friends Section ─── */

function BestFriendsSection({
  bestFriends,
  onNavigate,
}: {
  bestFriends: ProfileFriend[];
  onNavigate: (username: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (bestFriends.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4">
        <h3 className="font-bold text-sm mb-2">⭐ Bästa Vänner</h3>
        <p className="text-xs text-muted-foreground">Inga bästa vänner markerade ännu.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4">
      <h3 className="font-bold text-sm mb-3">⭐ Bästa Vänner</h3>
      <div className="relative">
        {bestFriends.length > 5 && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 border border-border rounded-full p-1 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-none px-1"
        >
          {bestFriends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => onNavigate(friend.username)}
              className="flex flex-col items-center gap-1 shrink-0 group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-primary/40 overflow-hidden group-hover:border-primary transition-colors">
                <Avatar name={friend.username} src={friend.avatar_url} size="lg" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-foreground truncate max-w-[60px] sm:max-w-[70px] text-center group-hover:text-primary transition-colors">
                {friend.username}
              </span>
            </button>
          ))}
        </div>
        {bestFriends.length > 5 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 border border-border rounded-full p-1 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Friend Row ─── */

function FriendRow({
  friend,
  getUserStatus,
  isOwnProfile,
  onNavigate,
  onToggleBestFriend,
}: {
  friend: ProfileFriend;
  getUserStatus: (userId: string) => UserStatus;
  isOwnProfile: boolean;
  onNavigate: () => void;
  onToggleBestFriend: (friendshipId: string, current: boolean) => void;
}) {
  const status = getUserStatus(friend.id);
  const genderAge = [friend.gender, friend.age].filter(Boolean).join(", ");

  return (
    <>
      {/* Desktop/tablet row */}
      <div className="hidden sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center px-3 py-2 border-b border-border/50 hover:bg-muted/30 transition-colors">
        <div className="w-9 cursor-pointer" onClick={onNavigate}>
          <Avatar name={friend.username} src={friend.avatar_url} size="sm" />
        </div>
        <div className="min-w-0">
          <span
            className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
            onClick={onNavigate}
          >
            {friend.username}
          </span>
          {genderAge && (
            <span className="text-xs text-muted-foreground ml-1">({genderAge})</span>
          )}
        </div>
        <div className="w-16 flex justify-center">
          <StatusIndicator status={status} size="sm" />
        </div>
        <div className="w-28 text-center hidden md:block lg:block">
          <span className="text-xs text-muted-foreground">
            {friend.last_seen ? formatTimeAgo(friend.last_seen) : "–"}
          </span>
        </div>
        {isOwnProfile && (
          <div className="w-14 flex justify-center">
            <Checkbox
              checked={friend.is_best_friend}
              onCheckedChange={() => onToggleBestFriend(friend.friendshipId, friend.is_best_friend)}
              className="border-primary/50 data-[state=checked]:bg-primary"
            />
          </div>
        )}
      </div>

      {/* Mobile row */}
      <div
        className="flex sm:hidden items-center gap-3 px-3 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={onNavigate}
      >
        <Avatar name={friend.username} src={friend.avatar_url} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{friend.username}</span>
          {genderAge && (
            <span className="text-xs text-muted-foreground ml-1">({genderAge})</span>
          )}
        </div>
        <StatusIndicator status={status} size="sm" />
      </div>
    </>
  );
}

/* ─── Personality Box ─── */

function PersonalityBox({ userId }: { userId: string }) {
  const { voteCounts, userVotes, totalVotes, toggleVote, loading } = useFriendVotes(userId);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-primary/15 border-b border-primary/30">
        <h3 className="text-sm font-bold text-primary">Personlighet</h3>
      </div>
      <div className="p-3">
        <PersonalityMeter
          voteCounts={voteCounts}
          userVotes={userVotes}
          totalVotes={totalVotes}
          onToggleVote={toggleVote}
          loading={loading}
        />
      </div>
    </div>
  );
}
