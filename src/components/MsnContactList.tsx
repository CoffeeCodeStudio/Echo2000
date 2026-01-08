import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { useMsnSounds } from "@/hooks/useMsnSounds";
import { ChevronDown, ChevronRight, Search, Plus, Settings, Mail } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

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

const mockContacts: MsnContact[] = [
  { id: "1", name: "~*Emma*~", email: "emma@echo2000.se", status: "online", statusMessage: "redo för helgen 🎉", unreadCount: 2 },
  { id: "2", name: "Marcus_92", email: "marcus@echo2000.se", status: "online", statusMessage: "Gaming mode ON", unreadCount: 0 },
  { id: "3", name: "★Sofia★", email: "sofia@echo2000.se", status: "away", statusMessage: "brb, äter mat", unreadCount: 0 },
  { id: "4", name: "Johan <3", email: "johan@echo2000.se", status: "busy", statusMessage: "Stör ej - pluggar!", unreadCount: 0 },
  { id: "5", name: "Lisa_xoxo", email: "lisa@echo2000.se", status: "offline", statusMessage: "", lastSeen: "2 timmar sedan" },
  { id: "6", name: "Erik ツ", email: "erik@echo2000.se", status: "offline", statusMessage: "", lastSeen: "igår" },
  { id: "7", name: "Anna~", email: "anna@echo2000.se", status: "online", statusMessage: "(L) Livet är underbart (L)", unreadCount: 5 },
];

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
  const [contacts, setContacts] = useState<MsnContact[]>(mockContacts);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    online: true,
    away: true,
    busy: true,
    offline: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [recentlyOnline, setRecentlyOnline] = useState<string[]>([]);
  const { playSound } = useMsnSounds();

  // Simulate contacts coming online/offline
  useEffect(() => {
    const interval = setInterval(() => {
      setContacts(prev => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const contact = prev[randomIndex];
        
        // 20% chance of status change
        if (Math.random() < 0.2) {
          const newStatus = contact.status === "offline" ? "online" : 
                           contact.status === "online" && Math.random() < 0.3 ? "away" : 
                           contact.status;
          
          if (newStatus !== contact.status) {
            // Play sound when someone comes online
            if (newStatus === "online" && soundEnabled) {
              playSound("online");
              setRecentlyOnline(prev => [...prev, contact.id]);
              setTimeout(() => {
                setRecentlyOnline(prev => prev.filter(id => id !== contact.id));
              }, 3000);
            }
            
            return prev.map((c, i) => 
              i === randomIndex ? { ...c, status: newStatus as UserStatus } : c
            );
          }
        }
        return prev;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [playSound, soundEnabled]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const groupContacts = (status: UserStatus) => {
    return contacts
      .filter(c => c.status === status)
      .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const onlineCount = contacts.filter(c => c.status === "online").length;
  const totalCount = contacts.length;

  const renderGroup = (status: UserStatus, label: string) => {
    const groupContacts_ = groupContacts(status);
    if (groupContacts_.length === 0 && searchQuery) return null;

    return (
      <div key={status} className="mb-1">
        <button
          onClick={() => toggleGroup(status)}
          className="w-full flex items-center gap-1 px-2 py-1 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          {expandedGroups[status] ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <span>{label} ({groupContacts_.length})</span>
        </button>
        
        {expandedGroups[status] && (
          <div className="pl-2">
            {groupContacts_.map(contact => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all",
                  "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                  selectedContactId === contact.id && "bg-blue-200 dark:bg-blue-800/50",
                  recentlyOnline.includes(contact.id) && "animate-pulse bg-green-100 dark:bg-green-900/30"
                )}
              >
                <div className="relative">
                  <Avatar name={contact.name} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusIndicator status={contact.status} size="sm" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "text-xs font-medium truncate",
                      contact.status === "online" ? "text-blue-700 dark:text-blue-400" : 
                      contact.status === "offline" ? "text-gray-500" : "text-gray-700 dark:text-gray-300",
                      recentlyOnline.includes(contact.id) && "text-green-600 dark:text-green-400 font-bold"
                    )}>
                      {contact.name}
                    </span>
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-orange-500 text-white rounded-full font-bold animate-pulse">
                        {contact.unreadCount}
                      </span>
                    )}
                  </div>
                  {contact.statusMessage && contact.status !== "offline" && (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate italic">
                      {contact.statusMessage}
                    </p>
                  )}
                  {contact.status === "offline" && contact.lastSeen && (
                    <p className="text-[10px] text-gray-400 truncate">
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

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800", className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2">
        <div className="text-xs font-medium">Mina kontakter</div>
        <div className="text-[10px] text-white/70">
          {onlineCount} av {totalCount} online
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            type="text"
            placeholder="Sök kontakter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs pl-7 bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      {/* Contact Groups */}
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
        {renderGroup("online", "🟢 Online")}
        {renderGroup("away", "🟡 Borta")}
        {renderGroup("busy", "🔴 Upptagen")}
        {renderGroup("offline", "⚫ Offline")}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 flex justify-around">
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Lägg till kontakt">
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="E-post">
          <Mail className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Inställningar">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
