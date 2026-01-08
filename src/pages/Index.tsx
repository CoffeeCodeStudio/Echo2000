import { useState } from "react";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { FriendsSidebar } from "@/components/FriendsSidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { WelcomeHero } from "@/components/WelcomeHero";
import { ProfileCard } from "@/components/ProfileCard";
import { CommunityCard } from "@/components/CommunityCard";
import { cn } from "@/lib/utils";

type Tab = "home" | "chat" | "community" | "profile";

const communities = [
  {
    id: "1",
    name: "Retro Gaming Lounge",
    description: "Discuss classic games from the 90s and 2000s",
    memberCount: 1234,
    messageCount: 8765,
    isActive: true,
  },
  {
    id: "2",
    name: "Music Memories",
    description: "Share your favorite nostalgic tunes and playlists",
    memberCount: 892,
    messageCount: 5432,
    isActive: false,
  },
  {
    id: "3",
    name: "Tech Throwback",
    description: "Remember when phones had buttons? Let's chat!",
    memberCount: 567,
    messageCount: 3210,
    isActive: true,
  },
  {
    id: "4",
    name: "Creative Corner",
    description: "Share art, music, and creative projects",
    memberCount: 445,
    messageCount: 2890,
    isActive: false,
  },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
            <WelcomeHero />
            
            {/* Communities Section */}
            <section className="container px-4 py-8">
              <h2 className="font-display font-bold text-xl mb-4">Active Communities</h2>
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

      case "chat":
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
                  className="fixed left-0 top-14 bottom-16 w-72 z-50 md:hidden animate-slide-in-right border-r border-border"
                />
              </>
            )}

            {/* Chat Area */}
            <ChatWindow className="flex-1" />
          </div>
        );

      case "community":
        return (
          <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
            <section className="container px-4 py-8">
              <h1 className="font-display font-bold text-2xl mb-2">Communities</h1>
              <p className="text-muted-foreground mb-6">Find your people and start chatting</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      case "profile":
        return (
          <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
            <section className="container px-4 py-8 max-w-md mx-auto">
              <ProfileCard
                name="Alex Johnson"
                username="alex_nostalgia"
                status="online"
                statusMessage="Living in the 2000s 🦋"
                bio="Web developer by day, retro gaming enthusiast by night. Miss the days of AIM and MSN! Building cool stuff with modern tech."
                location="Brooklyn, NY"
                joinDate="December 2025"
                friendsCount={47}
                isOwnProfile={true}
              />
            </section>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <main className={cn(
        "flex-1 flex overflow-hidden",
        "pb-16 md:pb-0" // Space for mobile nav
      )}>
        {renderContent()}
      </main>

      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
