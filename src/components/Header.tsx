import { LogIn, LogOut, Shield, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  const navItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "gastbok", label: "GÄSTBOK", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
    { id: "chatt", label: "DISKUS", emoji: "🖊️", animationClass: "writing-pen" },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Dark Navbar with ECHO2000 logo */}
      <div className="navbar-dark">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-white hover:bg-white/10 shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* ECHO2000 Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-display font-black text-lg sm:text-xl tracking-tight">
            <span className="text-white">ECHO</span>
            <span className="text-black bg-[#ff0000] px-1 rounded">2000</span>
          </div>
          <span className="text-[10px] text-white/60 hidden sm:inline">NOSTALGI</span>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-2 lg:gap-6 ml-4 lg:ml-8">
          {navItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onTabChange?.(item.id)}
              className={cn(
                "nav-item-dark",
                activeTab === item.id && "active"
              )}
            >
              <div className={cn("icon-dark", item.animationClass)}>
                {item.emoji}
              </div>
              <span className="label-dark hidden lg:block">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Right side - Auth & Status */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 ml-auto">
          {/* Auth buttons */}
          {!loading && (
            <>
              {user ? (
                <>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/admin")}
                      className="text-white hover:bg-white/10 text-xs gap-1 px-2 sm:px-3"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-white hover:bg-white/10 text-xs gap-1 px-2 sm:px-3"
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
                  className="text-white hover:bg-white/10 text-xs gap-1 px-2 sm:px-3"
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
    </header>
  );
}
