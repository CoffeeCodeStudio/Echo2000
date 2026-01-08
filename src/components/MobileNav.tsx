import { cn } from "@/lib/utils";
import { HomeIcon, ChatIcon, GuestbookIcon, MailIcon, LajvIcon } from "./LunarIcons";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-2 safe-area-inset-bottom">
        <NavButton
          icon={<HomeIcon size={24} />}
          label="Start"
          isActive={activeTab === "hem"}
          onClick={() => onTabChange("hem")}
        />
        <NavButton
          icon={<LajvIcon size={24} />}
          label="Lajv"
          isActive={activeTab === "lajv"}
          onClick={() => onTabChange("lajv")}
          highlight
        />
        <NavButton
          icon={<ChatIcon size={24} />}
          label="Diskus"
          isActive={activeTab === "chatt"}
          onClick={() => onTabChange("chatt")}
          badge={2}
        />
        <NavButton
          icon={<GuestbookIcon size={24} />}
          label="Gästbok"
          isActive={activeTab === "gastbok"}
          onClick={() => onTabChange("gastbok")}
        />
        <NavButton
          icon={<MailIcon size={24} />}
          label="Mejl"
          isActive={activeTab === "mejl"}
          onClick={() => onTabChange("mejl")}
          badge={5}
        />
      </div>
    </nav>
  );
}

function NavButton({
  icon,
  label,
  isActive,
  onClick,
  badge,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  const hasNotification = badge && badge > 0;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 relative min-w-[48px]",
        isActive
          ? "text-primary"
          : highlight
          ? "text-primary animate-pulse-soft"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(
        "relative",
        hasNotification && "animate-icon-walk"
      )}>
        {icon}
        {hasNotification && (
          <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full glow-online" />
      )}
    </button>
  );
}
