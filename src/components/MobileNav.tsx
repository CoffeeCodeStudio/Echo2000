import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { counts } = useNotifications();

  // Get badge count for each tab from real database
  const getBadge = (id: Tab): number | undefined => {
    switch (id) {
      case 'mejl': return counts.unreadMail > 0 ? counts.unreadMail : undefined;
      case 'vanner': return counts.pendingFriends > 0 ? counts.pendingFriends : undefined;
      case 'gastbok': return counts.guestbookNew > 0 ? counts.guestbookNew : undefined;
      case 'lajv': return counts.lajvActive > 0 ? counts.lajvActive : undefined;
      default: return undefined;
    }
  };

  // Profile-relevant nav items (main row) - reduced for mobile
  const mainNavItems: { id: Tab; label: string; emoji: string; animationClass: string }[] = [
    { id: "gastbok", label: "GÄST", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce" },
    { id: "chatt", label: "CHATT", emoji: "🖊️", animationClass: "writing-pen" },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
  ];

  // Secondary items for dropdown (includes profile now)
  const dropdownItems: { id: Tab; label: string; emoji: string }[] = [
    { id: "hem", label: "Hem", emoji: "🏠" },
    { id: "profil", label: "Min Profil", emoji: "👤" },
    { id: "klotterplanket", label: "Klotter", emoji: "🎨" },
    { id: "traffar", label: "Träffar", emoji: "📅" },
    { id: "spel", label: "Spel", emoji: "🎮" },
    { id: "lajv", label: "Lajv", emoji: "🎭" },
    { id: "faq", label: "FAQ", emoji: "❓" },
  ];

  const isDropdownItemActive = dropdownItems.some(item => item.id === activeTab);
  const activeDropdownItem = dropdownItems.find(item => item.id === activeTab);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-dark pb-safe">
      <div className="flex items-center justify-around py-3 px-2">
        {/* Dropdown menu button */}
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "mobile-nav-item",
                isDropdownItemActive && "active"
              )}
            >
              <div className="relative">
                <span className="mobile-nav-icon">{isDropdownItemActive ? activeDropdownItem?.emoji : "☰"}</span>
              </div>
              <span className="mobile-nav-label">{isDropdownItemActive ? activeDropdownItem?.label?.slice(0, 4).toUpperCase() : "MER"}</span>
              {isDropdownItemActive && (
                <div className="mobile-nav-indicator" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="start" 
            className="bg-card border-border mb-2 min-w-[160px]"
          >
            {dropdownItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMenuOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  activeTab === item.id && "bg-primary/20 text-primary"
                )}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Main profile-relevant nav items */}
        {mainNavItems.map((item) => {
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
                <span className={cn(
                  "mobile-nav-icon",
                  hasNotification && item.animationClass
                )}>
                  {item.emoji}
                </span>
                {hasNotification && (
                  <span className="mobile-nav-badge-corner">
                    {badge}
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
