import { LogIn, LogOut, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { HeaderRadio } from "./HeaderRadio";
import { GlobalSearch } from "./GlobalSearch";

type Tab =
  | "hem"
  | "chatt"
  | "gastbok"
  | "mejl"
  | "vanner"
  | "profil"
  | "klotterplanket"
  | "spel"
  | "traffar"
  | "lajv"
  | "faq";

interface HeaderProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onMenuClick?: () => void;
}

export function Header({ activeTab = "hem", onTabChange, onMenuClick }: HeaderProps) {
  const [onlineCount] = useState(35);
  const [isAdmin, setIsAdmin] = useState(false);

  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { counts } = useNotifications();

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
          _role: "admin",
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
        variant: "destructive",
      });
    } else {
      toast({
        title: "Du är utloggad",
        description: "Ses snart igen!",
      });
    }
  };

  // Home button (separate zone)
  const homeItem = { id: "hem" as Tab, label: "HEM", emoji: "🏠", animationClass: "scale-in" };

  // Private zone items (middle group)
  const privateZoneItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "gastbok", label: "GÄST", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
    { id: "chatt", label: "EMN", emoji: "🖊️", animationClass: "writing-pen" },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
    { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" },
  ];

  // Community zone items (right group)
  const communityZoneItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "klotterplanket", label: "KLOTTER", emoji: "🎨", animationClass: "writing-pen" },
    { id: "traffar", label: "TRÄFFAR", emoji: "📅", animationClass: "msn-bounce" },
    { id: "spel", label: "SPEL", emoji: "🎮", animationClass: "scale-in" },
    { id: "lajv", label: "LAJV", emoji: "🎭", animationClass: "heart-pulse" },
    { id: "faq", label: "FAQ", emoji: "❓", animationClass: "msn-bounce" },
  ];

  // Render nav item helper
  const renderNavItem = (item: { id: Tab; label: string; emoji: string; animationClass: string }, isHome = false) => {
    const hasNotice = getHasNotice(item.id);
    return (
      <div
        key={item.id}
        onClick={() => onTabChange?.(item.id)}
        className={cn(
          isHome ? "nav-item-home" : "nav-item-grouped",
          "shrink-0",
          activeTab === item.id && "active",
          !isHome && (hasNotice ? "has-notice" : "inactive"),
        )}
        role="button"
        tabIndex={0}
        aria-label={item.label}
      >
        <span className={cn(isHome ? "icon-home" : "icon-grouped", hasNotice && item.animationClass)}>
          {item.emoji}
        </span>
        <span className={isHome ? "label-home" : "label-grouped"}>{item.label}</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar - Logo, Auth & Status */}
      <div className="navbar-dark">
        {/* ECHO2000 Logo - Always visible */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-display font-black text-base sm:text-lg md:text-xl tracking-tight">
            <span className="text-foreground">ECHO</span>
            <span className="text-primary-foreground bg-primary px-1 rounded">2000</span>
          </div>
          {/* ALPHA Badge */}
          <span className="alpha-badge">ALPHA</span>
        </div>

        {/* Global Search */}
        <div className="hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Right side - Auth & Status */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 ml-auto">
          {!loading && (
            <>
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/admin")}
                      className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logga ut</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth")}
                  className="text-foreground hover:bg-muted text-xs gap-1 px-2 sm:px-3"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Logga in</span>
                </Button>
              )}
            </>
          )}

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

      {/* Three-Zone Nav Row (hidden on mobile, only lg and up) */}
      <nav className="hidden lg:flex navbar-three-zone">
        {/* Zone 1: Home (Left) */}
        <div className="nav-zone-home">{renderNavItem(homeItem, true)}</div>

        {/* Zone 2: Private Tools (Middle) */}
        <div className="nav-group-box private-zone">{privateZoneItems.map((item) => renderNavItem(item))}</div>

        {/* Zone 3: Community (Right) */}
        <div className="nav-group-box community-zone">{communityZoneItems.map((item) => renderNavItem(item))}</div>
      </nav>
    </header>
  );
}
