import { LogIn, LogOut, Shield, Settings } from "lucide-react";
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
import { GlobalSearch } from "./GlobalSearch";

type Tab =
"hem" |
"chatt" |
"gastbok" |
"mejl" |
"vanner" |
"profil" |
"klotterplanket" |
"spel" |
"traffar" |
"lajv" |
"faq";

interface HeaderProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onMenuClick?: () => void;
}

export function Header({ activeTab = "hem", onTabChange, onMenuClick }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);

  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { counts } = useNotifications();
  const { onlineUsers } = usePresence();

  const onlineCount = onlineUsers.size;

  // Determine which nav items have notifications
  const getHasNotice = (id: Tab): boolean => {
    switch (id) {
      case "mejl":
        return counts.unreadMail > 0;
      case "vanner":
        return counts.pendingFriends > 0;
      case "gastbok":
        return counts.guestbookNew > 0;
      case "lajv":
        return counts.lajvActive > 0;
      default:
        return false;
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin"
        });
        setIsAdmin(data === true);
      } catch {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Fel vid utloggning",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Du är utloggad",
        description: "Ses snart igen!"
      });
    }
  };

  // Home button (separate zone)
  const homeItem = { id: "hem" as Tab, label: "HEM", emoji: "🏠", animationClass: "scale-in" };

  // Private zone items (middle group)
  const privateZoneItems: {id: Tab;label: string;emoji: string;animationClass: string;}[] = [
  { id: "gastbok", label: "GÄST", emoji: "👣", animationClass: "footsteps" },
  { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
  { id: "chatt", label: "EMN", emoji: "🖊️", animationClass: "writing-pen" },
  { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
  { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" }];


  // Community zone items (right group)
  const communityZoneItems: {id: Tab;label: string;emoji: string;animationClass: string;}[] = [
  { id: "klotterplanket", label: "KLOTTER", emoji: "🎨", animationClass: "writing-pen" },
  { id: "traffar", label: "TRÄFFAR", emoji: "📅", animationClass: "msn-bounce" },
  { id: "spel", label: "SPEL", emoji: "🎮", animationClass: "scale-in" },
  { id: "lajv", label: "LAJV", emoji: "🎭", animationClass: "heart-pulse" },
  { id: "faq", label: "FAQ", emoji: "❓", animationClass: "msn-bounce" }];


  // Render nav item helper
  const renderNavItem = (item: {id: Tab;label: string;emoji: string;animationClass: string;}, isHome = false) => {
    const hasNotice = getHasNotice(item.id);
    return (
      <div
        key={item.id}
        onClick={() => onTabChange?.(item.id)}
        className={cn(
          isHome ? "nav-item-home" : "nav-item-grouped",
          "shrink-0",
          activeTab === item.id && "active",
          !isHome && (hasNotice ? "has-notice" : "inactive")
        )}
        role="button"
        tabIndex={0}
        aria-label={item.label}>

        <span className={cn(isHome ? "icon-home" : "icon-grouped", hasNotice && item.animationClass)}>
          {item.emoji}
        </span>
        <span className={isHome ? "label-home" : "label-grouped"}>{item.label}</span>
      </div>);

  };

  // Render compact header nav item
  const renderHeaderNavItem = (item: {id: Tab;label: string;emoji: string;animationClass: string;}) => {
    const hasNotice = getHasNotice(item.id);
    return (
      <div
        key={item.id}
        onClick={() => onTabChange?.(item.id)}
        className={cn(
          "header-nav-item",
          activeTab === item.id && "active",
          hasNotice && "has-notice"
        )}
        role="button"
        tabIndex={0}
        aria-label={item.label}>

        <span className={cn("header-nav-icon", hasNotice && item.animationClass)}>
          {item.emoji}
        </span>
        <span className="header-nav-label">{item.label}</span>
        {hasNotice && <span className="header-nav-dot" />}
      </div>);

  };

  return (
    <header className="sticky top-0 z-50">
      {/* Marquee ticker - hidden on very small screens to save space */}
      <div className="hidden sm:block bg-primary/10 border-b border-border overflow-hidden">
        <div className="marquee-container">
          <span className="marquee-text text-xs text-primary font-medium">
            ⭐ Välkommen till Echo2000 — Nordens nostalgiska community! 🎮 Chatta, träffa nya vänner och reliv 2000-talet! 🦋 Alpha-version — nya funktioner släpps löpande! ✨ Tack för att du är en tidig medlem! 💖
          </span>
        </div>
      </div>
      {/* Single compact header bar */}
      <div className="navbar-dark">
        {/* ECHO2000 Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="font-display font-black text-base sm:text-lg md:text-xl tracking-tight cursor-pointer"
            onClick={() => onTabChange?.("hem")}
            role="button"
            tabIndex={0}>

            <span className="bg-transparent text-accent">ECHO</span>
            <span className="bg-primary px-1 rounded text-primary-foreground">2000</span>
          </div>
          <span className="alpha-badge">ALPHA</span>
        </div>

        {/* Global Search */}
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Private Nav Items - inline in header (desktop only, logged in only) */}
        {user &&
        <nav className="hidden lg:flex items-center gap-0.5 mx-2">
            {privateZoneItems.map((item) => renderHeaderNavItem(item))}
          </nav>
        }

        {/* Community Nav Items (desktop only) - show all for logged in, only HEM for logged out */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {user ?
          [homeItem, ...communityZoneItems].map((item) => renderHeaderNavItem(item)) :
          renderHeaderNavItem(homeItem)
          }
        </nav>

        {/* Right side - Auth & Status */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 ml-auto">
          {!loading &&
          <>
              {user ?
            <>
                  {isAdmin &&
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
                aria-label="Admin">

                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
              }
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/settings")}
                    className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
                    aria-label="Inställningar">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Inställningar</span>
                  </Button>
                  <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
                aria-label="Logga ut">

                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logga ut</span>
                  </Button>
                </> :

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3 min-h-[44px] min-w-[44px]"
              aria-label="Logga in">

                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Logga in</span>
                </Button>
            }
            </>
          }

          {/* Radio control */}
          <HeaderRadio />

          {/* Status Box */}
          <div className="status-box-dark">
            <div className="online-dot-dark"></div>
            <span className="count-dark hidden sm:inline">{onlineCount} JUST NU</span>
            <span className="count-dark sm:hidden">{onlineCount}</span>
          </div>
        </div>
      </div>
    </header>);

}