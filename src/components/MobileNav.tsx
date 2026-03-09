import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

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
            <span className="mobile-tab-icon">🏠</span>
          </button>
        </div>
      </nav>
    );
  }

  const mainTabs: { id: Tab; emoji: string; badge?: number }[] = [
    { id: "hem", emoji: "🏠" },
    { id: "folk", emoji: "🌐" },
    { id: "mejl", emoji: "✉️", badge: counts.unreadMail > 0 ? counts.unreadMail : undefined },
    { id: "profil", emoji: "👤", badge: counts.guestbookNew > 0 ? counts.guestbookNew : undefined },
  ];

  const moreTabs: { id: Tab; emoji: string; label: string }[] = [
    { id: "chatt", emoji: "🖊️", label: "Chatt" },
    { id: "vanner", emoji: "❤️", label: "Vänner" },
    { id: "gastbok", emoji: "👣", label: "Gäst" },
    { id: "besokare", emoji: "👀", label: "Spanare" },
    { id: "lajv", emoji: "🎭", label: "Lajv" },
    { id: "traffar", emoji: "📅", label: "Träffar" },
    { id: "klotterplanket", emoji: "🎨", label: "Klotter" },
    { id: "spel", emoji: "🎮", label: "Spel" },
    { id: "faq", emoji: "❓", label: "FAQ" },
  ];

  const handleMoreItemClick = (tab: Tab) => {
    onTabChange(tab);
    setMoreMenuOpen(false);
  };

  const moreTabIds = moreTabs.map(t => t.id);
  const moreIsActive = moreTabIds.includes(activeTab);

  return (
    <>
      {moreMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div
            className="absolute bottom-[70px] right-4 left-4 bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-5 gap-1">
              {moreTabs.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreItemClick(item.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-tab-bar pb-safe transition-transform duration-300",
        !isVisible && "translate-y-full"
      )}>
        <div className="flex items-center justify-around h-[60px] px-6">
          {mainTabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn("mobile-tab-item", isActive && "active")}
              >
                <div className="relative">
                  <span className="mobile-tab-icon">{item.emoji}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="mobile-tab-badge">{item.badge > 9 ? "9+" : item.badge}</span>
                  )}
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            className={cn("mobile-tab-item", (moreMenuOpen || moreIsActive) && "active")}
          >
            <span className="mobile-tab-icon">{moreMenuOpen ? "✖️" : "•••"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
