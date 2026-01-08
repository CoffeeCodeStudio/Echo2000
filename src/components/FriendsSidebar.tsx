import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { FriendItem } from "./FriendItem";
import { cn } from "@/lib/utils";
import type { UserStatus } from "./StatusIndicator";

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
}

const mockFriends: Friend[] = [
  { id: "1", name: "Sarah Chen", status: "online", statusMessage: "🎵 Listening to music" },
  { id: "2", name: "Mike Johnson", status: "online", statusMessage: "Available to chat!" },
  { id: "3", name: "Emma Davis", status: "away", statusMessage: "BRB in 5 mins" },
  { id: "4", name: "Alex Kim", status: "busy", statusMessage: "In a meeting" },
  { id: "5", name: "Jordan Taylor", status: "online" },
  { id: "6", name: "Chris Brown", status: "offline" },
  { id: "7", name: "Lisa Wang", status: "offline", statusMessage: "Gone fishing 🎣" },
];

interface FriendsSidebarProps {
  selectedFriendId?: string;
  onSelectFriend: (id: string) => void;
  className?: string;
}

export function FriendsSidebar({ selectedFriendId, onSelectFriend, className }: FriendsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [onlineExpanded, setOnlineExpanded] = useState(true);
  const [offlineExpanded, setOfflineExpanded] = useState(false);

  const filteredFriends = mockFriends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter((f) => f.status !== "offline");
  const offlineFriends = filteredFriends.filter((f) => f.status === "offline");

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
            placeholder="Search friends..."
            className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 input-glow transition-all"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic p-2">
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
              avatar={friend.avatar}
              status={friend.status}
              statusMessage={friend.statusMessage}
              isActive={selectedFriendId === friend.id}
              onClick={() => onSelectFriend(friend.id)}
            />
          ))}
        </FriendsSection>
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
