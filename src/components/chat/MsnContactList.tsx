import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "../Avatar";
import { StatusIndicator, type UserStatus } from "../StatusIndicator";
import { useMsnSounds } from "@/hooks/useMsnSounds";
import { ChevronDown, ChevronRight, Search, Loader2 } from "lucide-react";
import { Input } from "../ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";

export interface MsnContact {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  statusMessage: string;
  avatar?: string;
  lastSeen?: string;
  unreadCount?: number;
}

interface MsnContactListProps {
  onSelectContact: (contact: MsnContact) => void;
  selectedContactId?: string;
  className?: string;
  soundEnabled?: boolean;
}

export function MsnContactList({ 
  onSelectContact, 
  selectedContactId, 
  className,
  soundEnabled = true 
}: MsnContactListProps) {
  const [contacts, setContacts] = useState<MsnContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    online: true,
    away: true,
    busy: true,
    offline: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { playSound } = useMsnSounds();
  const { user } = useAuth();
  const { getUserStatus } = usePresence();

  // Fetch real friends from database
  useEffect(() => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const fetchContacts = async () => {
      setLoading(true);
      try {
        // Get accepted friendships
        const { data: friendships, error } = await supabase
          .from("friends")
          .select("*")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq("status", "accepted");

        if (error) throw error;

        if (!friendships || friendships.length === 0) {
          setContacts([]);
          setLoading(false);
          return;
        }

        // Get friend user IDs
        const friendUserIds = friendships.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        // Fetch profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message")
          .in("user_id", friendUserIds);

        // Get unread chat message counts per sender
        const { data: unreadChatMessages } = await supabase
          .from("chat_messages")
          .select("sender_id")
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        const unreadCounts: Record<string, number> = {};
        unreadChatMessages?.forEach(msg => {
          unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
        });

        // Map to contacts with real presence status
        const contactsList: MsnContact[] = friendships.map((friendship) => {
          const friendUserId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id;
          const profile = profiles?.find((p) => p.user_id === friendUserId);
          const presenceStatus = getUserStatus(friendUserId);

          return {
            id: friendUserId,
            name: profile?.username || "Okänd",
            email: `${profile?.username || "user"}@echo2000.se`,
            status: presenceStatus,
            statusMessage: profile?.status_message || "",
            avatar: profile?.avatar_url || undefined,
            unreadCount: unreadCounts[friendUserId] || 0,
          };
        });

        setContacts(contactsList);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("msn-contacts")
      .on("postgres_changes", { event: "*", schema: "public", table: "friends" }, fetchContacts)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchContacts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, getUserStatus]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groupContacts = (status: UserStatus) => {
    return contacts
      .filter(c => c.status === status)
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const onlineCount = contacts.filter(c => c.status === "online").length;
  const awayCount = contacts.filter(c => c.status === "away").length;
  const busyCount = contacts.filter(c => c.status === "busy").length;
  const offlineCount = contacts.filter(c => c.status === "offline").length;

  const renderContactGroup = (status: UserStatus, label: string, count: number) => {
    const groupContacts_ = groupContacts(status);
    if (groupContacts_.length === 0 && searchQuery) return null;
    
    return (
      <div key={status} className="mb-1">
        <button
          onClick={() => toggleGroup(status)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-xs font-bold rounded transition-colors",
            "hover:bg-muted/50 text-foreground"
          )}
        >
          {expandedGroups[status] ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <StatusIndicator status={status} size="sm" />
          <span>{label}</span>
          <span className="ml-auto text-[11px] text-muted-foreground font-medium">({count})</span>
        </button>
        
        {expandedGroups[status] && (
          <div className="ml-2 space-y-0.5">
            {groupContacts_.map((contact) => (
              <button
                key={contact.id}
              onClick={() => {
                  if (soundEnabled) playSound("message");
                  onSelectContact(contact);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded transition-all",
                  "hover:bg-primary/10",
                  selectedContactId === contact.id && "bg-primary/20 border-l-2 border-primary"
                )}
              >
                <Avatar 
                  name={contact.name} 
                  src={contact.avatar} 
                  status={contact.status} 
                  size="sm" 
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-sm font-semibold truncate",
                      contact.status === "offline" ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {contact.name}
                    </span>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  {contact.statusMessage && (
                    <p className="text-[11px] text-foreground/70 truncate italic">
                      {contact.statusMessage}
                    </p>
                  )}
                  {contact.status === "offline" && contact.lastSeen && (
                    <p className="text-[10px] text-muted-foreground">
                      Senast online: {contact.lastSeen}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">Logga in för att se dina kontakter</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök kontakter..."
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic p-1">
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-sm mb-1">🌟 Här var det tomt!</p>
            <p className="text-xs">Sök efter vänner för att komma igång.</p>
          </div>
        ) : (
          <>
            {renderContactGroup("online", "Online", onlineCount)}
            {renderContactGroup("away", "Borta", awayCount)}
            {renderContactGroup("busy", "Upptagen", busyCount)}
            {renderContactGroup("offline", "Offline", offlineCount)}
          </>
        )}
      </div>

      {/* Status bar */}
      <div className="p-2 border-t border-border bg-muted/30">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <StatusIndicator status="online" size="sm" />
          <span>{contacts.length} kontakter ({onlineCount} online)</span>
        </div>
      </div>
    </div>
  );
}
