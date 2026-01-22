import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Profile-relevant nav items (main row)
  const mainNavItems: { id: Tab; label: string; emoji: string; animationClass: string; badge?: number }[] = [
    { id: "gastbok", label: "GÄSTBOK", emoji: "👣", animationClass: "footsteps" },
    { id: "mejl", label: "MEJL", emoji: "✉️", animationClass: "msn-bounce", badge: 5 },
    { id: "chatt", label: "DISKUS", emoji: "🖊️", animationClass: "writing-pen", badge: 2 },
    { id: "vanner", label: "VÄNNER", emoji: "❤️", animationClass: "heart-pulse" },
    { id: "profil", label: "PROFIL", emoji: "👤", animationClass: "scale-in" },
  ];

  // Secondary items for dropdown
  const dropdownItems: { id: Tab; label: string; emoji: string }[] = [
    { id: "hem", label: "Hem", emoji: "🏠" },
    { id: "klotterplanket", label: "Klotterplanket", emoji: "🎨" },
    { id: "traffar", label: "Träffar", emoji: "📅" },
    { id: "spel", label: "Spel", emoji: "🎮" },
    { id: "lajv", label: "Lajv", emoji: "🎭" },
    { id: "faq", label: "FAQ", emoji: "❓" },
  ];

  const isDropdownItemActive = dropdownItems.some(item => item.id === activeTab);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-nav-dark">
      <div className="flex items-center justify-around py-2 px-1 safe-area-inset-bottom">
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
                <span className="mobile-nav-icon">☰</span>
              </div>
              <span className="mobile-nav-label">MER</span>
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
