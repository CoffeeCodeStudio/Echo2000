import { LogIn, LogOut, Shield, Settings, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { usePresence } from "@/hooks/usePresence";
import { HeaderRadio } from "./HeaderRadio";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { FriendRequestPanel } from "./friends/FriendRequestPanel";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq" | "besokare" | "folk";

interface HeaderProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onMenuClick?: () => void;
}

export function Header({ activeTab = "hem", onTabChange, onMenuClick }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [friendRequestOpen, setFriendRequestOpen] = useState(false);
  const [kulOpen, setKulOpen] = useState(false);

  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { counts } = useNotifications();
  const { onlineUsers } = usePresence();
  const [onlineBotCount, setOnlineBotCount] = useState(0);

  useEffect(() => {
    const fetchBotCount = async () => {
      const eightMinAgo = new Date(Date.now() - 8 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_bot", true)
        .gte("last_seen", eightMinAgo);
      setOnlineBotCount(count ?? 0);
    };
    fetchBotCount();
    const interval = setInterval(fetchBotCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = onlineUsers.size + onlineBotCount;

  const getHasNotice = (id: Tab): boolean => {
    switch (id) {
      case "mejl": return counts.unreadMail > 0;
      case "vanner": return counts.pendingFriends > 0;
      case "gastbok": return counts.guestbookNew > 0;
      case "lajv": return counts.lajvActive > 0;
      case "besokare": return counts.newVisitors > 0;
      default: return false;
    }
  };

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) { setIsAdmin(false); setIsPrivileged(false); return; }
      try {
        const [{ data: adminData }, { data: modData }] = await Promise.all([
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: user.id, _role: "moderator" }),
        ]);
        setIsAdmin(adminData === true);
        setIsPrivileged(adminData === true || modData === true);
      } catch {
        setIsAdmin(false);
        setIsPrivileged(false);
      }
    };
    checkRoles();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ title: "Fel vid utloggning", description: error.message, variant: "destructive" });
    } else {
      onTabChange?.("hem");
      navigate("/", { replace: true, state: { tab: "hem" } });
      toast({ title: "Du är utloggad", description: "Ses snart igen!" });
    }
  };

  useEffect(() => {
    if (!isAdmin) { setPendingCount(0); return; }
    const fetchPending = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_approved", false)
        .eq("is_bot", false);
      setPendingCount(count ?? 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30_000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const privateZoneItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "gastbok", label: "GÄST", emoji: "👣", animationClass: "footsteps" },
    ...(isPrivileged ? [{ id: "mejl" as Tab, label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" }] : []),
    { id: "chatt", label: "EMN", emoji: "🖊️", animationClass: "writing-pen" },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
    { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" },
    { id: "besokare", label: "SPANARE", emoji: "👀", animationClass: "scale-in" },
  ];

  const communityZoneItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "folk", label: "FOLK", emoji: "🌐", animationClass: "scale-in" },
    { id: "faq", label: "FAQ", emoji: "❓", animationClass: "msn-bounce" },
  ];

  const kulItems: { id: Tab; label: string; emoji: string }[] = [
    { id: "spel", label: "SPEL", emoji: "🎮" },
    { id: "klotterplanket", label: "KLOTTER", emoji: "🎨" },
    { id: "traffar", label: "TRÄFFAR", emoji: "📅" },
  ];

  const renderHeaderNavItem = (item: { id: Tab; label: string; emoji: string; animationClass: string }) => {
    const hasNotice = getHasNotice(item.id);
    const isHeart = item.id === "vanner";
    const pendingFr = counts.pendingFriends;

    const handleClick = () => {
      if (isHeart && pendingFr > 0) {
        setFriendRequestOpen(true);
      } else {
        onTabChange?.(item.id);
      }
    };

    return (
      <div
        key={item.id}
        onClick={handleClick}
        className={cn(
          "header-nav-item",
          activeTab === item.id && "active",
          hasNotice && "has-notice"
        )}
        role="button"
        tabIndex={0}
        aria-label={item.label}
      >
        <span className={cn("header-nav-icon", hasNotice && item.animationClass)}>
          {item.emoji}
        </span>
        <span className="header-nav-label">{item.label}</span>
        {isHeart && pendingFr > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-[#cc0000] text-white rounded-full px-0.5 leading-none">
            {pendingFr > 9 ? "9+" : pendingFr}
          </span>
        )}
        {item.id === "besokare" && counts.newVisitors > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-[#cc0000] text-white rounded-full px-0.5 leading-none">
            {counts.newVisitors > 9 ? "9+" : counts.newVisitors}
          </span>
        )}
        {item.id === "gastbok" && counts.guestbookNew > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-[#cc0000] text-white rounded-full px-0.5 leading-none">
            {counts.guestbookNew > 9 ? "9+" : counts.guestbookNew}
          </span>
        )}
        {hasNotice && !isHeart && item.id !== "besokare" && item.id !== "gastbok" && <span className="header-nav-dot" />}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar: logo + status — polished gradient */}
      <div className="bg-gradient-to-b from-[#5a5a5a] to-[#444] border-b-2 border-primary/60 flex items-center justify-between px-2 py-1.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div
            className="cursor-pointer flex items-center"
            onClick={() => onTabChange?.("hem")}
            role="button"
            tabIndex={0}
          >
            <img
              alt="Echo2000"
              className="h-5 w-auto object-contain brightness-[1.8] contrast-[1.1]"
              src="/lovable-uploads/8fa3ad97-e123-4eb1-87e7-aca699e44627.png"
            />
          </div>
          <span className="beta-badge">BETA</span>
          {user && (
            <span className="text-[10px] text-white/60 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.6)]" />
              {onlineCount} online
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!loading && (
            <>
              {user ? (
                <>
                  {isAdmin && (
                    <button
                      onClick={() => navigate("/admin")}
                      className="relative px-2 py-1 text-[10px] font-bold text-white/80 bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1 transition-colors"
                      aria-label="Admin"
                    >
                      <Shield className="w-3 h-3" />
                      <span className="hidden sm:inline">Admin</span>
                      {pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#cc0000] text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 shadow-[0_1px_3px_rgba(204,0,0,0.4)]">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="px-2 py-1 text-[10px] font-bold text-white/80 bg-white/10 border border-white/20 hover:bg-white/20 flex items-center gap-1 transition-colors"
                        aria-label="Användarmeny"
                      >
                        <User className="w-3 h-3" />
                        <span className="hidden sm:inline">Meny</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-white border border-[#999] rounded-none text-[11px]">
                      <DropdownMenuItem onClick={() => onTabChange?.("profil")} className="cursor-pointer gap-2 text-[11px]">
                        <User className="w-3 h-3" /> Profil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer gap-2 text-[11px]">
                        <Settings className="w-3 h-3" /> Inställningar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2 text-[11px] text-[#cc0000]">
                        <LogOut className="w-3 h-3" /> Logga ut
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="px-3 py-1 text-[10px] font-bold text-white bg-primary border border-primary/60 hover:brightness-110 flex items-center gap-1 transition-all shadow-sm"
                  aria-label="Logga in"
                >
                  <LogIn className="w-3 h-3" />
                  Logga in
                </button>
              )}
            </>
          )}
          <HeaderRadio />
        </div>
      </div>

      {/* Nav tabs — desktop only */}
      {user && (
        <div className="hidden md:flex items-stretch bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] border-b border-[#aaa]">
          {/* Home */}
          <div
            onClick={() => onTabChange?.("hem")}
            className={cn("header-nav-item", activeTab === "hem" && "active")}
            role="button"
            tabIndex={0}
          >
            <span className="header-nav-icon">🏠</span>
            <span className="header-nav-label">HEM</span>
          </div>

          {/* Private zone */}
          {privateZoneItems.map((item) => renderHeaderNavItem(item))}

          {/* Separator */}
          <div className="w-px bg-[#999]" />

          {/* Community zone */}
          {communityZoneItems.map((item) => renderHeaderNavItem(item))}

          {/* KUL dropdown */}
          <Popover open={kulOpen} onOpenChange={setKulOpen}>
            <PopoverTrigger asChild>
              <div
                className={cn("header-nav-item cursor-pointer", kulOpen && "active")}
                role="button"
                tabIndex={0}
              >
                <span className="header-nav-icon">🎉</span>
                <span className="header-nav-label">KUL</span>
              </div>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              sideOffset={0}
              className="w-auto p-0 border border-[#999] bg-white rounded-none"
            >
              <div className="flex flex-col">
                {kulItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange?.(item.id); setKulOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-left text-[#333] hover:bg-[#eee] border-b border-[#ddd] last:border-b-0"
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      <FriendRequestPanel open={friendRequestOpen} onOpenChange={setFriendRequestOpen} />
    </header>
  );
}
