/**
 * @module ProfilePage
 * Main profile page component. Delegates rendering to sub-components in
 * `./profile/` for maintainability.
 */
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { usePresence } from "@/hooks/usePresence";
import { useProfileVisits } from "@/hooks/useProfileVisits";
import type { UserStatus } from "./StatusIndicator";

import { ProfileInfoSection } from "./profile/ProfileInfoSection";
import { ProfileGuestbook } from "./ProfileGuestbook";
import { VisitorLog } from "./VisitorLog";
import {
  type EditableProfileData,
  demoProfile,
  toEditableData,
} from "./profile/profile-constants";

interface ProfilePageProps {
  userId?: string;
  /** Which sub-section to show below the profile card */
  showSection?: "profile" | "gastbok" | "besokare";
}

export function ProfilePage({ userId, showSection }: ProfilePageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, saving, isOwnProfile, updateProfile } = useProfile(userId);
  const { getUserStatus, getUserActivity } = usePresence();

  const profileUserId = profile?.user_id || userId || user?.id;
  const { visitors, loading: visitorsLoading } = useProfileVisits(profileUserId);

  const isLoggedIn = !!user;
  const showDemoMode = !isLoggedIn && !userId;

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditableProfileData>(toEditableData(null));

  // Sync editData when profile loads
  useEffect(() => {
    if (profile) setEditData(toEditableData(profile));
  }, [profile]);

  const handleSave = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profile) setEditData(toEditableData(profile));
    setIsEditing(false);
  };

  // Loading state
  if (loading && !showDemoMode) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Laddar profil...</p>
        </div>
      </div>
    );
  }

  // Profile not found
  if (!showDemoMode && !profile && userId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <h2 className="font-display font-bold text-xl mb-4">Profil hittades inte</h2>
          <p className="text-muted-foreground">Denna profil finns inte.</p>
        </div>
      </div>
    );
  }

  // Determine display data
  const displayData: EditableProfileData = showDemoMode
    ? demoProfile
    : isEditing
      ? editData
      : toEditableData(profile);

  // Derive status: use presence for real users, last_seen fallback for bots
  const presenceStatus: UserStatus = profileUserId ? getUserStatus(profileUserId) : "offline";
  const userStatus: UserStatus = (() => {
    if (presenceStatus !== "offline") return presenceStatus;
    if (profile?.last_seen) {
      const lastSeenMs = Date.now() - new Date(profile.last_seen).getTime();
      if (lastSeenMs < 3 * 60 * 1000) return "online";
      if (lastSeenMs < 8 * 60 * 1000) return "away";
    }
    return "offline";
  })();

  const userActivity = profileUserId ? getUserActivity(profileUserId) : undefined;
  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long" })
    : "December 2025";
  const lastSeen = profile?.last_seen
    ? new Date(profile.last_seen).toLocaleDateString("sv-SE", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  // Determine what to show below the card:
  // - Viewing someone else's profile → always show guestbook
  // - Own profile with showSection="gastbok" → show guestbook
  // - Own profile with showSection="besokare" → show visitor log
  const showGuestbook = (!isOwnProfile && !showDemoMode && profileUserId) || showSection === "gastbok";
  const showVisitors = isOwnProfile && showSection === "besokare";

  // Spanare-only view: skip profile card, show only visitor log
  if (showVisitors) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
        <div className="container px-4 py-4 max-w-5xl mx-auto">
          <div className="bg-card rounded-lg border border-border p-4">
            {visitorsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <VisitorLog visitors={visitors} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
      {/* Demo Mode Banner */}
      {showDemoMode && (
        <div className="bg-accent/20 border-b border-accent px-4 py-2">
          <div className="container flex items-center justify-between">
            <p className="text-sm text-accent-foreground">
              👀 <strong>Demo-läge:</strong> Detta är en exempelprofil. Logga in för att skapa din egen!
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate("/auth")} className="text-xs">
              Skapa konto
            </Button>
          </div>
        </div>
      )}

      {/* Profile content */}
      <div className="container px-4 py-4 max-w-5xl mx-auto space-y-4">
        <ProfileInfoSection
          displayData={displayData}
          editData={editData}
          setEditData={setEditData}
          isEditing={isEditing}
          isOwnProfile={isOwnProfile}
          showDemoMode={showDemoMode}
          userId={userId}
          userStatus={userStatus}
          userActivity={userActivity}
          lastSeen={lastSeen}
          memberSince={memberSince}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
          isBot={profile?.is_bot}
        />

        {/* Guestbook — shown for visitors on other profiles, and own profile via gastbok tab */}
        {showGuestbook && profileUserId && (
          <ProfileGuestbook
            profileOwnerId={profileUserId}
            isOwnProfile={isOwnProfile}
          />
        )}
      </div>
    </div>
  );
}
