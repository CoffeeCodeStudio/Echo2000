import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext, useLocation, useNavigate } from "react-router-dom";
import { useRadio } from "@/contexts/RadioContext";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { HomeContent } from "@/components/HomeContent";
import { ProfilePage } from "@/components/ProfilePage";
// Guestbook import removed - unified into ProfilePage
import { Mailbox } from "@/components/social/Mailbox";
import { ProfileFriendsTab } from "@/components/ProfileFriendsTab";
import { MemberGrid } from "@/components/social/MemberGrid";
import { Klotterplanket } from "@/components/social/Klotterplanket";
import { GamesSection } from "@/components/games/GamesSection";
import { LockedMeetups } from "@/components/social/LockedMeetups";
import { LajvSection } from "@/components/social/LajvSection";
import { FAQSection } from "@/components/FAQSection";
import { OnboardingModal } from "@/components/auth/OnboardingModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePresence } from "@/hooks/usePresence";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import type { LayoutContext } from "@/components/SharedLayout";

type Tab = "hem" | "chatt" | "gastbok" | "mejl" | "vanner" | "profil" | "klotterplanket" | "spel" | "traffar" | "lajv" | "faq" | "besokare" | "folk";

const TAB_ORDER: Record<Tab, number> = {
  hem: 0, gastbok: 1, profil: 2, vanner: 3,
  folk: 4, klotterplanket: 5, faq: 6, besokare: 7,
  chatt: 8, mejl: 9, spel: 10, traffar: 11, lajv: 12,
};
export default function Index() {
  const location = useLocation();
  const context = useOutletContext<LayoutContext>();
  
  // Use context from SharedLayout
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, handleUnreadCountChange } = context || {
    activeTab: "hem" as Tab,
    setActiveTab: () => {},
    sidebarOpen: false,
    setSidebarOpen: () => {},
    handleUnreadCountChange: () => {},
  };

  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile();
  const { setActivity } = usePresence();
  const { isPlaying, currentStation } = useRadio();
  const { markGuestbookRead, markVisitorsRead } = useNotifications();

  // Fetch user role
  useEffect(() => {
    if (!user) { setUserRole(null); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const role = data?.[0]?.role ?? null;
        setUserRole(role);
      });
  }, [user]);


  useEffect(() => {
    if (activeTab === 'gastbok' && user) {
      markGuestbookRead();
    }
  }, [activeTab, user, markGuestbookRead]);

  // Mark visitors as read when the user opens the besokare tab
  useEffect(() => {
    if (activeTab === 'besokare' && user) {
      markVisitorsRead();
    }
  }, [activeTab, user, markVisitorsRead]);

  // Update activity based on active tab + radio state
  useEffect(() => {
    // Radio playing takes priority
    if (isPlaying && currentStation) {
      const radioLabel = currentStation.isDj
        ? `Lyssnar på DJ: ${currentStation.name}`
        : `Lyssnar på ${currentStation.name}`;
      setActivity(radioLabel);
      return;
    }

    const tabActivityMap: Record<string, string> = {
      hem: 'Surfar runt',
      chatt: 'Chattar',
      gastbok: 'Kollar gästboken',
      mejl: 'Läser mejl',
      vanner: 'Kollar vänlistan',
      folk: 'Kollar medlemmar',
      profil: 'Kollar sin profil',
      klotterplanket: 'Klottrar',
      spel: 'Spelar spel',
      traffar: 'Kollar träffar',
      lajv: 'Lajvar',
      besokare: 'Kollar sina spanare',
      faq: 'Läser FAQ',
    };
    setActivity(tabActivityMap[activeTab] || 'Surfar runt');
  }, [activeTab, setActivity, isPlaying, currentStation]);

  // Handle tab from navigation state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state, setActiveTab]);

  // Show onboarding only for brand-new accounts (created < 5 min ago) that
  // haven't filled in basic info yet. Never show for bots.
  useEffect(() => {
    if (!user || profileLoading || !profile) {
      setShowOnboarding(false);
      return;
    }

    // Skip bots
    if (profile.is_bot) {
      setShowOnboarding(false);
      return;
    }

    // Use auth user's created_at (more reliable than profile.created_at)
    const userCreatedAt = user.created_at ? new Date(user.created_at).getTime() : 0;
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isNewAccount = userCreatedAt > fiveMinutesAgo;

    // Only show onboarding for very new accounts that haven't filled basic info
    // Check for actual content (not just empty strings which are the defaults)
    const hasGender = profile.gender && profile.gender.trim().length > 0;
    const hasCity = profile.city && profile.city.trim().length > 0;
    const hasAge = profile.age !== null && profile.age > 0;

    if (isNewAccount && (!hasGender || !hasCity || !hasAge)) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user, profile, profileLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchProfile();
  };

  const renderContent = () => {
    // Protected tabs require login
    const protectedTabs: Tab[] = ["chatt", "gastbok", "mejl", "vanner", "profil", "klotterplanket", "spel", "traffar", "lajv", "besokare", "folk"];
    if (!user && protectedTabs.includes(activeTab)) {
      // Redirect to auth for non-logged-in users trying to access protected tabs
      navigate("/auth", { replace: true });
      return null;
    }

    switch (activeTab) {
      case "hem":
        return <HomeContent />;

      case "chatt":
        if (userRole === 'admin' || userRole === 'moderator') {
          return <ChatWindow />;
        }
        return (
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <div className="nostalgia-card p-8 max-w-md text-center border-primary/30">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">🖊️</span>
              </div>
              <h2 className="font-display font-bold text-xl mb-2">UNDER UTVECKLING</h2>
              <p className="text-muted-foreground">
                EchoMessenger öppnar senare under Beta-perioden!
              </p>
            </div>
          </div>
        );

      case "gastbok":
        return <ProfilePage showSection="gastbok" />;

      case "mejl":
        return <Mailbox onUnreadCountChange={handleUnreadCountChange} />;

      case "vanner":
        return user ? (
          <div className="flex-1 flex flex-col overflow-y-auto scrollbar-nostalgic p-2">
            <ProfileFriendsTab userId={user.id} />
          </div>
        ) : null;

      case "folk":
        return <MemberGrid />;

      case "klotterplanket":
        return <Klotterplanket />;

      case "spel":
        if (userRole === 'admin' || userRole === 'moderator') {
          return <GamesSection />;
        }
        return (
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <div className="nostalgia-card p-8 max-w-md text-center border-primary/30">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-3xl">🎮</span>
              </div>
              <h2 className="font-display font-bold text-xl mb-2">UNDER UTVECKLING</h2>
              <p className="text-muted-foreground">
                Spel öppnar senare under Spel öppnar senare under Beta-perioden!!
              </p>
            </div>
          </div>
        );

      case "traffar":
        return <LockedMeetups />;

      case "lajv":
        return <LajvSection />;

      case "faq":
        return <FAQSection />;

      case "profil":
        return <ProfilePage />;

      case "besokare":
        return <ProfilePage showSection="besokare" />;

      default:
        return null;
    }
  };

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal userId={user.id} onComplete={handleOnboardingComplete} />
      )}

      <div key={activeTab} className="flex-1 flex flex-col min-h-0 animate-fade-in">
        {renderContent()}
      </div>
    </>
  );
}
