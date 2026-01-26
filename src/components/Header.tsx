import { LogIn, LogOut, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

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
      case 'mejl': return counts.unreadMail > 0;
      case 'vanner': return counts.pendingFriends > 0;
      case 'gastbok': return counts.guestbookNew > 0;
      case 'lajv': return counts.lajvActive > 0;
      default: return false;
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data } = await supabase.rpc('has_role', { 
          _user_id: user.id, 
          _role: 'admin' 
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

  // All nav items in one row for desktop
  const allNavItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "hem", label: "HEM", emoji: "🏠", animationClass: "scale-in" },
    { id: "gastbok", label: "GÄSTBOK", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
    { id: "chatt", label: "DISKUS", emoji: "🖊️", animationClass: "writing-pen" },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
    { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" },
    { id: "klotterplanket", label: "KLOTTER", emoji: "🎨", animationClass: "writing-pen" },
    { id: "traffar", label: "TRÄFFAR", emoji: "📅", animationClass: "msn-bounce" },
    { id: "spel", label: "SPEL", emoji: "🎮", animationClass: "scale-in" },
    { id: "lajv", label: "LAJV", emoji: "🎭", animationClass: "heart-pulse" },
    { id: "faq", label: "FAQ", emoji: "❓", animationClass: "msn-bounce" },
  ];

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

          {/* Status Box */}
          <div className="status-box-dark">
            <div className="online-dot-dark"></div>
            <span className="count-dark hidden sm:inline">{onlineCount} JUST NU</span>
            <span className="count-dark sm:hidden">{onlineCount}</span>
          </div>
        </div>
      </div>

      {/* Single Nav Row - All items (hidden on mobile) */}
      <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 xl:gap-10 py-2.5 px-4 navbar-single-row overflow-x-auto scrollbar-hide">
        {allNavItems.map((item) => {
          const hasNotice = getHasNotice(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={cn(
                "nav-item-single shrink-0",
                activeTab === item.id && "active",
                hasNotice ? "has-notice" : "inactive"
              )}
              role="button"
              tabIndex={0}
              aria-label={item.label}
            >
              <span className={cn(
                "icon-single",
                hasNotice && item.animationClass
              )}>
                {item.emoji}
              </span>
              <span className="label-single">{item.label}</span>
            </div>
          );
        })}
      </nav>
    </header>
  );
}
