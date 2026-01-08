import { useState } from "react";
import { Search, UserPlus, MessageSquare, Star, MoreHorizontal } from "lucide-react";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  isBestFriend: boolean;
}

const friends: Friend[] = [
  { id: "1", name: "Emma", username: "emma_00", status: "online", statusMessage: "Chilla hemma 🏠", isBestFriend: true },
  { id: "2", name: "Johan", username: "johansen", status: "online", statusMessage: "Gaming! 🎮", isBestFriend: true },
  { id: "3", name: "Lisa", username: "lisa_k", status: "away", statusMessage: "brb", isBestFriend: false },
  { id: "4", name: "Marcus", username: "marcusd", status: "online", statusMessage: "", isBestFriend: false },
  { id: "5", name: "Sofia", username: "sofian", status: "busy", statusMessage: "Pluggar 📚", isBestFriend: true },
  { id: "6", name: "Erik", username: "eriksson", status: "offline", statusMessage: "", isBestFriend: false },
  { id: "7", name: "Anna", username: "anna_b", status: "offline", statusMessage: "Semester! ✈️", isBestFriend: false },
  { id: "8", name: "Oscar", username: "oscar92", status: "online", statusMessage: "Musik 🎵", isBestFriend: false },
];

export function FriendsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "online" | "best">("all");

  const filteredFriends = friends.filter(friend => {
    const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         friend.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === "online") return matchesSearch && friend.status !== "offline";
    if (filter === "best") return matchesSearch && friend.isBestFriend;
    return matchesSearch;
  });

  const onlineCount = friends.filter(f => f.status !== "offline").length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="nostalgia-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display font-bold text-xl mb-1">👥 Mina Vänner</h1>
              <p className="text-sm text-muted-foreground">
                {onlineCount} av {friends.length} online just nu
              </p>
            </div>
            <Button variant="msn">
              <UserPlus className="w-4 h-4 mr-2" />
              Lägg till
            </Button>
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
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded transition-colors",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Alla ({friends.length})
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
        </div>

        {/* Friends list */}
        <div className="nostalgia-card overflow-hidden divide-y divide-border">
          {filteredFriends.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>Inga vänner hittades</p>
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
              >
                <Avatar name={friend.name} status={friend.status} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{friend.name}</span>
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
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
