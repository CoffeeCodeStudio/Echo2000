import { cn } from "@/lib/utils";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const navItems: { id: Tab; label: string; emoji: string; animationClass: string; badge?: number }[] = [
    { id: "hem", label: "START", emoji: "🏠", animationClass: "" },
    { id: "gastbok", label: "GÄSTBOK", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce", badge: 5 },
    { id: "chatt", label: "DISKUS", emoji: "🖊️", animationClass: "writing-pen", badge: 2 },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-dark">
      <div className="flex items-center justify-around py-2 px-1 safe-area-inset-bottom">
        {navItems.map((item) => {
          const hasNotification = item.badge && item.badge > 0;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "mobile-nav-item",
                activeTab === item.id && "active"
              )}
            >
              <div className="relative">
                <span className={cn("mobile-nav-icon", item.animationClass)}>
                  {item.emoji}
                </span>
                {hasNotification && (
                  <span className="mobile-nav-badge">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
              {activeTab === item.id && (
                <div className="mobile-nav-indicator" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
