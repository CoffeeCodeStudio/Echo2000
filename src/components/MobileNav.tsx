import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { counts } = useNotifications();
  const { user } = useAuth();

  // If not logged in, show only HEM
  if (!user) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-dark pb-safe">
        <div className="flex items-center justify-center py-3 px-2">
          <button
            onClick={() => onTabChange("hem")}
            className={cn("mobile-nav-item", activeTab === "hem" && "active")}
          >
            <span className="mobile-nav-icon">🏠</span>
            <span className="mobile-nav-label">HEM</span>
            {activeTab === "hem" && <div className="mobile-nav-indicator" />}
          </button>
        </div>
      </nav>
    );
  }

  const getBadge = (id: Tab): number | undefined => {
    switch (id) {
      case 'mejl': return counts.unreadMail > 0 ? counts.unreadMail : undefined;
      case 'vanner': return counts.pendingFriends > 0 ? counts.pendingFriends : undefined;
      case 'gastbok': return counts.guestbookNew > 0 ? counts.guestbookNew : undefined;
      case 'lajv': return counts.lajvActive > 0 ? counts.lajvActive : undefined;
      default: return undefined;
    }
  };

  // All items visible – two rows for maximum retro clarity
  const topRowItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "hem", label: "HEM", emoji: "🏠", animationClass: "scale-in" },
    { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" },
    { id: "gastbok", label: "GÄST", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
    { id: "chatt", label: "CHATT", emoji: "🖊️", animationClass: "writing-pen" },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
  ];

  const bottomRowItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "klotterplanket", label: "KLOTTER", emoji: "🎨", animationClass: "writing-pen" },
    { id: "lajv", label: "LAJV", emoji: "🎭", animationClass: "heart-pulse" },
    { id: "traffar", label: "TRÄFFAR", emoji: "📅", animationClass: "msn-bounce" },
    { id: "spel", label: "SPEL", emoji: "🎮", animationClass: "scale-in" },
    { id: "faq", label: "FAQ", emoji: "❓", animationClass: "msn-bounce" },
  ];

  const renderItem = (item: { id: Tab; label: string; emoji: string; animationClass: string }) => {
    const badge = getBadge(item.id);
    const hasNotification = badge !== undefined && badge > 0;
    const isInactive = !hasNotification;

    return (
      <button
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={cn(
          "mobile-nav-item",
          activeTab === item.id && "active",
          isInactive && activeTab !== item.id && "inactive"
        )}
      >
        <div className="relative">
          <span className={cn("mobile-nav-icon", hasNotification && item.animationClass)}>
            {item.emoji}
          </span>
          {hasNotification && <span className="mobile-nav-badge-corner">{badge}</span>}
        </div>
        <span className="mobile-nav-label">{item.label}</span>
        {activeTab === item.id && <div className="mobile-nav-indicator" />}
      </button>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-dark pb-safe">
      {/* Secondary row - community items */}
      <div className="flex items-center justify-around px-1 py-1 border-b border-border/30">
        {bottomRowItems.map(renderItem)}
      </div>
      {/* Primary row - personal items */}
      <div className="flex items-center justify-around px-1 py-1">
        {topRowItems.map(renderItem)}
      </div>
    </nav>
  );
}
