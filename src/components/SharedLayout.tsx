import { useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { UnreadMailBar } from "@/components/UnreadMailBar";
import { GlobalLajvTicker } from "@/components/GlobalLajvTicker";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

export function SharedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [hideNavbar, setHideNavbar] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL or default to "hem"
  const getActiveTab = (): Tab => {
    const path = location.pathname;
    if (path.startsWith("/profile")) return "profil";
    if (path === "/rum") return "chatt";
    if (path === "/auth") return "hem";
    return "hem";
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTab());

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Navigate to home when changing tabs from external pages
    if (location.pathname !== "/") {
      navigate("/", { state: { tab } });
    }
  };

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadMailCount(count);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background overflow-x-hidden">
      <Header 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Lajv ticker - inline row below navbar */}
      <GlobalLajvTicker />
      
      {/* Unread mail notification bar */}
      <UnreadMailBar 
        unreadCount={unreadMailCount} 
        onTabChange={(tab) => handleTabChange(tab as Tab)} 
      />

      {/* Main content outlet */}
      <main className="flex-1 flex overflow-hidden pb-24 md:pb-0">
        <Outlet context={{ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, handleUnreadCountChange, hideNavbar, setHideNavbar }} />
      </main>

      {/* Mobile bottom navigation - hidden when input is focused */}
      {!hideNavbar && <MobileNav activeTab={activeTab} onTabChange={handleTabChange} />}
    </div>
  );
}

// Export context type for children to use
export interface LayoutContext {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  handleUnreadCountChange: (count: number) => void;
  hideNavbar: boolean;
  setHideNavbar: (hide: boolean) => void;
}
