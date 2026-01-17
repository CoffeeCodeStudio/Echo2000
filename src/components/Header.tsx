import { Menu, Bell, Search } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar } from "./Avatar";
import { Input } from "./ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GuestbookIcon, MailIcon, ChatIcon, FriendsIcon, LajvIcon } from "./LunarIcons";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

interface HeaderProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onMenuClick?: () => void;
}

export function Header({ activeTab = "hem", onTabChange, onMenuClick }: HeaderProps) {
  const [notificationCount] = useState(3);
  const [mailCount] = useState(5);

  const mainNavItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number; animation: string }[] = [
    { id: "gastbok", label: "GÄSTBOK", icon: <GuestbookIcon size={20} />, animation: "animate-waddle" },
    { id: "mejl", label: "MEJL", icon: <MailIcon size={20} />, badge: mailCount, animation: "animate-msn-bounce" },
    { id: "chatt", label: "DISKUS", icon: <ChatIcon size={20} />, animation: "animate-writing" },
    { id: "vanner", label: "VÄNNER", icon: <FriendsIcon size={20} />, animation: "animate-heartbeat" },
  ];

  const subNavItems: { id: Tab; label: string; icon?: React.ReactNode; highlight?: boolean }[] = [
    { id: "hem", label: "START" },
    { id: "lajv", label: "LAJV", icon: <LajvIcon size={14} />, highlight: true },
    { id: "profil", label: "PROFIL" },
    { id: "chatt", label: "DISKUS" },
    { id: "klotterplanket", label: "KLOTTERPLANKET" },
    { id: "spel", label: "SPEL" },
    { id: "traffar", label: "TRÄFFAR" },
    { id: "faq", label: "REGLER" },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Main header bar */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary)/0.9)] to-[hsl(var(--accent))] text-primary-foreground">
        <div className="container flex items-center justify-between h-12 px-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden text-primary-foreground hover:bg-white/10"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="font-display font-black text-xl tracking-tight">
              <span className="text-white">ECHO</span>
              <span className="text-accent-foreground bg-accent px-1 rounded">2000</span>
            </div>
            <span className="text-[10px] text-white/60 hidden sm:inline">NOSTALGI</span>
          </div>

          {/* Desktop Main Navigation */}
          <nav className="hidden md:flex items-center gap-1" style={{ backgroundColor: '#335577' }}>
            {mainNavItems.map((item) => {
              const hasNotification = item.badge && item.badge > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange?.(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all group",
                    activeTab === item.id
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className={cn("icon-glow", item.animation)}>
                    {item.icon}
                  </span>
                  {item.label}
                  {hasNotification && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-accent text-accent-foreground rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side - Search & Notifications */}
          <div className="flex items-center gap-2">
            {/* Quick Search */}
            <div className="hidden lg:flex items-center gap-1 bg-white/10 rounded px-2 py-1">
              <Search className="w-3 h-3 text-white/60" />
              <Input
                placeholder="Snabbsök..."
                className="h-6 w-24 bg-transparent border-0 text-xs text-white placeholder:text-white/50 focus-visible:ring-0"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-white/10">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Avatar
              name="Du"
              status="online"
              size="sm"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          </div>
        </div>
      </div>

      {/* Secondary navigation bar */}
      <div className="bg-card border-b border-border">
        <div className="container px-4">
          <nav className="hidden md:flex items-center gap-0.5 py-1">
            {subNavItems.map((item) => (
              <button
                key={item.id + item.label}
                onClick={() => onTabChange?.(item.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all flex items-center gap-1",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground"
                    : item.highlight
                    ? "text-primary hover:bg-primary/10 animate-pulse-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* LAJU - Recent activity ticker */}
          <div className="flex items-center gap-2 py-2 text-xs border-t border-border md:border-t-0">
            <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">LANSEN</span>
            <span className="text-muted-foreground truncate">
              <span className="font-semibold text-foreground">Emma</span> kommenterade din bild - idag kl:14:32
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
