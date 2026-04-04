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
import { useBlockList } from "@/hooks/useBlockList";
import { useSignInNotifications } from "@/hooks/useSignInNotifications";

export interface MsnContact {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  statusMessage: string;
  avatar?: string;
  lastSeen?: string;
  unreadCount?: number;
  isBot?: boolean;
}

interface MsnContactListProps {
  onSelectContact: (contact: MsnContact) => void;
  selectedContactId?: string;
  className?: string;
  soundEnabled?: boolean;
  userDisplayName?: string;
  userStatus?: UserStatus;
  userAvatar?: string;
}

export function MsnContactList({ 
  onSelectContact, 
  selectedContactId, 
  className,
  soundEnabled = true,
  userDisplayName,
  userStatus = "online",
  userAvatar,
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
  const { getUserStatus, onlineUsers } = usePresence();
  const { isBlocked } = useBlockList();

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

        const friendUserIds = friendships.map((f) =>
          f.user_id === user.id ? f.friend_id : f.user_id
        );

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, status_message, is_bot")
          .in("user_id", friendUserIds);

        const { data: unreadChatMessages } = await supabase
          .from("chat_messages")
          .select("sender_id")
          .eq("recipient_id", user.id)
          .eq("is_read", false);

        const unreadCounts: Record<string, number> = {};
        unreadChatMessages?.forEach(msg => {
          unreadCounts[msg.sender_id] = (unreadCounts[msg.sender_id] || 0) + 1;
        });

        const contactsList: MsnContact[] = friendships
          .map((friendship) => {
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
              isBot: profile?.is_bot || false,
            };
          })
          .filter((c) => !isBlocked(c.id));

        setContacts(contactsList);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();

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

  const statusColorMap: Record<string, string> = {
    online: "bg-[#3fb950]",   // MSN green
    away: "bg-[#e3b341]",     // MSN yellow/away
    busy: "bg-[#da3633]",     // MSN red/busy
    offline: "bg-[#8b949e]",  // MSN grey
  };

  const renderContactGroup = (status: UserStatus, label: string, count: number) => {
    const groupContacts_ = groupContacts(status);
    if (groupContacts_.length === 0 && searchQuery) return null;
    
    return (
      <div key={status}>
        <button
          onClick={() => toggleGroup(status)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors",
            "lunar-box-header"
          )}
        >
          {expandedGroups[status] ? (
            <ChevronDown className="w-3 h-3 text-white/70" />
          ) : (
            <ChevronRight className="w-3 h-3 text-white/70" />
          )}
          <div className={cn("w-2 h-2 rounded-full", statusColorMap[status])} />
          <span className="text-white">{label}</span>
          <span className="ml-auto text-[10px] text-white/60 font-normal">({count})</span>
        </button>
        
        {expandedGroups[status] && (
          <div>
            {groupContacts_.map((contact, i) => (
              <button
                key={contact.id}
                onClick={() => {
                  if (soundEnabled) playSound("message");
                  onSelectContact(contact);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 transition-all border-b border-border",
                  "hover:bg-[#fff3e6]",
                  selectedContactId === contact.id && "bg-[#fff3e6] border-l-2 border-l-[#ff6600]",
                  i % 2 === 0 ? "bg-card" : "bg-muted/40"
                )}
              >
                {/* 32x32 avatar */}
                <div className="w-8 h-8 overflow-hidden flex-shrink-0 border border-border">
                  {contact.avatar ? (
                    <img src={contact.avatar} alt={contact.name} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1">
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusColorMap[contact.status])} />
                    <span className={cn(
                      "text-[11px] font-bold truncate",
                      contact.status === "offline" ? "text-muted-foreground" : "text-foreground"
                    )}>
                      {contact.name}
                    </span>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="bg-[#ff6600] text-white text-[9px] font-bold px-1 py-0 min-w-[14px] text-center animate-pulse">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  {contact.statusMessage && (
                    <p className="text-[10px] text-muted-foreground truncate italic ml-3">
                      {contact.statusMessage}
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
    <div className={cn("flex flex-col h-full bg-card", className)}>
      {/* User info bar with retro gradient */}
      <div className="lunar-box-header px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 overflow-hidden border border-white/30 flex-shrink-0">
            {userAvatar ? (
              <img src={userAvatar} alt={userDisplayName || "Du"} loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                {(userDisplayName || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", statusColorMap[userStatus])} />
              <span className="text-white text-[12px] font-bold truncate">
                {userDisplayName || "Du"}
              </span>
            </div>
            <p className="text-white/60 text-[10px] truncate">
              {userStatus === "online" ? "Online" : userStatus === "away" ? "Borta" : userStatus === "busy" ? "Upptagen" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-border bg-muted/50">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök kontakter..."
            className="pl-7 h-6 text-[11px] bg-card border-border"
          />
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <p className="text-[11px] mb-1">🌟 Här var det tomt!</p>
            <p className="text-[10px]">Sök efter vänner för att komma igång.</p>
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
      <div className="px-3 py-1 border-t border-border bg-muted/50">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <div className={cn("w-1.5 h-1.5 rounded-full", statusColorMap["online"])} />
          <span>{contacts.length} kontakter ({onlineCount} online)</span>
        </div>
      </div>
    </div>
  );
}
