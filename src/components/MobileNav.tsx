import { MessageSquare, Users, User, Home, BookOpen, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket";

interface MobileNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-2 safe-area-inset-bottom">
        <NavButton
          icon={<Home className="w-5 h-5" />}
          label="Start"
          isActive={activeTab === "hem"}
          onClick={() => onTabChange("hem")}
        />
        <NavButton
          icon={<MessageSquare className="w-5 h-5" />}
          label="Chatt"
          isActive={activeTab === "chatt"}
          onClick={() => onTabChange("chatt")}
          badge={2}
        />
        <NavButton
          icon={<BookOpen className="w-5 h-5" />}
          label="Gästbok"
          isActive={activeTab === "gastbok"}
          onClick={() => onTabChange("gastbok")}
        />
        <NavButton
          icon={<Mail className="w-5 h-5" />}
          label="Mejl"
          isActive={activeTab === "mejl"}
          onClick={() => onTabChange("mejl")}
          badge={5}
        />
        <NavButton
          icon={<User className="w-5 h-5" />}
          label="Profil"
          isActive={activeTab === "profil"}
          onClick={() => onTabChange("profil")}
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
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 relative min-w-[48px]",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="relative">
        {icon}
        {badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-accent text-accent-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
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
