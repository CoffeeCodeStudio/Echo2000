/**
 * @module ProfileInfoSection
 * Main "PROFIL" tab content – thin render shell delegating to sub-components.
 */
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FriendActionButtons } from "@/components/friends/FriendActionButtons";
import { Input } from "@/components/ui/input";
import type { UserStatus } from "@/components/StatusIndicator";
import type { EditableProfileData } from "./profile-constants";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileBasicInfo } from "./ProfileBasicInfo";
import { ProfileFieldsGrid } from "./ProfileFieldsGrid";
import { ProfileLookingFor } from "./ProfileLookingFor";
import { ProfileBioStatus } from "./ProfileBioStatus";

interface ProfileInfoSectionProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  isOwnProfile: boolean;
  showDemoMode: boolean;
  userId?: string;
  userStatus: UserStatus;
  userActivity?: string;
  lastSeen: string | null;
  memberSince: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

export function ProfileInfoSection({
  displayData, editData, setEditData, isEditing, isOwnProfile, showDemoMode, userId,
  userStatus, userActivity, lastSeen, memberSince, onEdit, onSave, onCancel, saving,
}: ProfileInfoSectionProps) {
  const navigate = useNavigate();
  const drLoveScore = 73;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="p-4">
        {/* Username + Edit button row */}
        <div className="flex items-start justify-between mb-4">
          <h1 className="font-display font-bold text-2xl sm:text-3xl uppercase bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {displayData.username}
          </h1>
          {isOwnProfile && !showDemoMode && (
            <div className="shrink-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={onSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Spara
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Redigera
                </Button>
              )}
            </div>
          )}
          {showDemoMode && (
            <Button size="sm" variant="default" onClick={() => navigate("/auth")} className="shrink-0">
              Logga in
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <ProfileAvatar
            displayData={displayData}
            editData={editData}
            setEditData={setEditData}
            isEditing={isEditing}
          />
          <div className="flex-1 min-w-0">
            <ProfileBasicInfo
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
              userStatus={userStatus}
              userActivity={userActivity}
              lastSeen={lastSeen}
            />
            <ProfileFieldsGrid
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
            />
            <ProfileLookingFor
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
            />
          </div>
        </div>
      </div>

      {/* Status Message */}
      <div className="border-t border-border px-4 py-3 text-center">
        {isEditing ? (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase mb-1">Statusmeddelande</h3>
            <Input
              value={editData.status_message}
              onChange={(e) => setEditData({ ...editData, status_message: e.target.value })}
              className="text-sm max-w-md mx-auto" placeholder="Vad gör du just nu?"
            />
          </div>
        ) : (
          displayData.status_message && (
            <p className="text-sm text-foreground/80 italic">
              "{displayData.status_message}"
            </p>
          )
        )}
      </div>

      {/* Action Buttons Bar */}
      {!isOwnProfile && userId && (
        <div className="bg-gradient-to-r from-muted/50 via-muted to-muted/50 border-t border-border px-4 py-2">
          <FriendActionButtons targetUserId={userId} targetUsername={displayData.username} />
        </div>
      )}

      {/* Dr. Love */}
      {!isOwnProfile && (
        <div className="bg-muted/30 border-t border-border px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-accent">DR. LOVE:</span>
            <span className="text-muted-foreground">
              {drLoveScore}% kan funka om du klär ut dig till chimpans och drar ett skämt!
            </span>
          </div>
        </div>
      )}

      <ProfileBioStatus
        displayData={displayData}
        editData={editData}
        setEditData={setEditData}
        isEditing={isEditing}
        memberSince={memberSince}
      />
    </div>
  );
}
