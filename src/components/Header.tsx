import { Menu, MessageCircle, Users, User, Bell } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar } from "./Avatar";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [notificationCount] = useState(3);

  return (
    <header className="msn-header sticky top-0 z-50 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14 px-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg hidden sm:inline text-glow">
            NostalgiaChat
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem icon={<MessageCircle className="w-4 h-4" />} label="Chat" isActive />
          <NavItem icon={<Users className="w-4 h-4" />} label="Community" />
          <NavItem icon={<User className="w-4 h-4" />} label="Profile" />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-glow">
                {notificationCount}
              </span>
            )}
          </Button>
          <Avatar
            name="You"
            status="online"
            size="sm"
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </div>
      </div>
    </header>
  );
}

function NavItem({ 
  icon, 
  label, 
  isActive = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive?: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-primary glow-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
