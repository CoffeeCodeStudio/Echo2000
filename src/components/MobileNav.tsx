import { useRef } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const allTabs: { id: Tab; emoji: string; badge?: number }[] = [
    { id: "hem", emoji: "🏠" },
    { id: "folk", emoji: "🌐" },
    { id: "mejl", emoji: "✉️", badge: counts.unreadMail > 0 ? counts.unreadMail : undefined },
    { id: "chatt", emoji: "🖊️" },
    { id: "vanner", emoji: "❤️" },
    { id: "profil", emoji: "👤", badge: counts.guestbookNew > 0 ? counts.guestbookNew : undefined },
    { id: "gastbok", emoji: "👣" },
    { id: "besokare", emoji: "👀", badge: counts.newVisitors > 0 ? counts.newVisitors : undefined },
    { id: "lajv", emoji: "🎭" },
    { id: "traffar", emoji: "📅" },
    { id: "klotterplanket", emoji: "🎨" },
    { id: "spel", emoji: "🎮" },
    { id: "faq", emoji: "❓" },
  ];

  return (
    <nav className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-tab-bar pb-safe transition-transform duration-300",
      !isVisible && "translate-y-full"
    )}>
      <div
        ref={scrollRef}
        className="flex items-center h-[60px] px-2 gap-1 overflow-x-auto scrollbar-none"
      >
        {allTabs.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn("mobile-tab-item shrink-0", isActive && "active")}
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
      </div>
    </nav>
  );
}
