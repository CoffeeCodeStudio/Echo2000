import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { FriendsSidebar } from "@/components/FriendsSidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { WelcomeHero } from "@/components/WelcomeHero";
import { ProfilePage } from "@/components/ProfilePage";
import { CommunityCard } from "@/components/CommunityCard";
import { Guestbook } from "@/components/Guestbook";
import { Mailbox } from "@/components/Mailbox";
import { FriendsList } from "@/components/FriendsList";
import { Klotterplanket } from "@/components/Klotterplanket";
import { GamesSection } from "@/components/GamesSection";
import { MeetupsSection } from "@/components/MeetupsSection";
import { LajvSection } from "@/components/LajvSection";
import { FAQSection } from "@/components/FAQSection";
import { UnreadMailBar } from "@/components/UnreadMailBar";
import { cn } from "@/lib/utils";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq";

const communities = [
  {
    id: "1",
    name: "Retro Gaming Lounge",
    description: "Diskutera klassiska spel från 90- och 2000-talet",
    memberCount: 1234,
    messageCount: 8765,
    isActive: true,
  },
  {
    id: "2",
    name: "Musikminnen",
    description: "Dela dina favorit nostalgiska låtar och spellistor",
    memberCount: 892,
    messageCount: 5432,
    isActive: false,
  },
  {
    id: "3",
    name: "Tech Throwback",
    description: "Minns du när telefoner hade knappar? Låt oss snacka!",
    memberCount: 567,
    messageCount: 3210,
    isActive: true,
  },
  {
    id: "4",
    name: "Kreativa Hörnan",
    description: "Dela konst, musik och kreativa projekt",
    memberCount: 445,
    messageCount: 2890,
    isActive: false,
  },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("hem");
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadMailCount(count);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "hem":
        return (
          <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
            <WelcomeHero />

            {/* Communities Section */}
            <section className="container px-4 py-8">
              <h2 className="font-display font-bold text-xl mb-4">Aktiva Gemenskaper</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {communities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    name={community.name}
                    description={community.description}
                    memberCount={community.memberCount}
                    messageCount={community.messageCount}
                    isActive={community.isActive}
                  />
                ))}
              </div>
            </section>
          </div>
        );

      case "chatt":
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop Sidebar */}
            <FriendsSidebar
              selectedFriendId={selectedFriendId}
              onSelectFriend={(id) => {
                setSelectedFriendId(id);
                setSidebarOpen(false);
              }}
              className="hidden md:flex w-72 border-r border-border"
            />

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <>
                <div
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
                <FriendsSidebar
                  selectedFriendId={selectedFriendId}
                  onSelectFriend={(id) => {
                    setSelectedFriendId(id);
                    setSidebarOpen(false);
                  }}
                  className="fixed left-0 top-24 bottom-16 w-72 z-50 md:hidden animate-slide-in-right border-r border-border"
                />
              </>
            )}

            {/* Chat Area */}
            <ChatWindow className="flex-1" />
          </div>
        );

      case "gastbok":
        return <Guestbook />;

      case "mejl":
        return <Mailbox onUnreadCountChange={handleUnreadCountChange} />;

      case "vanner":
        return <FriendsList />;

      case "klotterplanket":
        return <Klotterplanket />;

      case "spel":
        return <GamesSection />;

      case "traffar":
        return <MeetupsSection />;

      case "lajv":
        return <LajvSection />;

      case "faq":
        return <FAQSection />;

      case "profil":
        return <ProfilePage />;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Unread mail notification bar - only shows when logged in with unread mail */}
      <UnreadMailBar 
        unreadCount={unreadMailCount} 
        onTabChange={(tab) => setActiveTab(tab as Tab)} 
      />

      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}
