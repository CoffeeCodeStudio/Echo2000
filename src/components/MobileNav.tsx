import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { Home, Users, MessageCircle, User, MoreHorizontal, HelpCircle, Palette, Calendar, Gamepad2, X } from "lucide-react";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq" | "besokare" | "folk";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isVisible?: boolean;
}

export function MobileNav({ activeTab, onTabChange, isVisible = true }: MobileNavProps) {
  const { counts } = useNotifications();
  const { user } = useAuth();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // If not logged in, show only HEM
  if (!user) {
    return (
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-tab-bar pb-safe transition-transform duration-300",
        !isVisible && "translate-y-full"
      )}>
        <div className="flex items-center justify-center h-[60px]">
          <button
            onClick={() => onTabChange("hem")}
            className={cn("mobile-tab-item", activeTab === "hem" && "active")}
          >
            <Home className="mobile-tab-icon" />
          </button>
        </div>
      </nav>
    );
  }

  const getTotalBadge = (): number => {
    return counts.unreadMail + counts.pendingFriends + counts.guestbookNew;
  };

  const mainTabs: { id: Tab; icon: typeof Home; badge?: number }[] = [
    { id: "hem", icon: Home },
    { id: "folk", icon: Users },
    { id: "chatt", icon: MessageCircle, badge: counts.unreadMail > 0 ? counts.unreadMail : undefined },
    { id: "profil", icon: User, badge: counts.guestbookNew > 0 ? counts.guestbookNew : undefined },
  ];

  const moreTabs: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: "faq", icon: HelpCircle, label: "FAQ" },
    { id: "klotterplanket", icon: Palette, label: "Klotter" },
    { id: "traffar", icon: Calendar, label: "Träffar" },
    { id: "spel", icon: Gamepad2, label: "Spel" },
  ];

  const handleMoreItemClick = (tab: Tab) => {
    onTabChange(tab);
    setMoreMenuOpen(false);
  };

  return (
    <>
      {/* More menu popup */}
      {moreMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div 
            className="absolute bottom-[70px] right-4 left-4 bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-2">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreItemClick(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main tab bar */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-tab-bar pb-safe transition-transform duration-300",
        !isVisible && "translate-y-full"
      )}>
        <div className="flex items-center justify-around h-[60px] px-6">
          {mainTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn("mobile-tab-item", isActive && "active")}
              >
                <div className="relative">
                  <Icon className="mobile-tab-icon" />
                  {item.badge && item.badge > 0 && (
                    <span className="mobile-tab-badge">{item.badge > 9 ? "9+" : item.badge}</span>
                  )}
                </div>
              </button>
            );
          })}
          
          {/* More button */}
          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={cn(
              "mobile-tab-item",
              moreMenuOpen && "active",
              moreTabs.some(t => t.id === activeTab) && "active"
            )}
          >
            {moreMenuOpen ? (
              <X className="mobile-tab-icon" />
            ) : (
              <MoreHorizontal className="mobile-tab-icon" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
