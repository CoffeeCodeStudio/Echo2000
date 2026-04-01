/**
 * @module ProfileInfoSection
 * Main "PROFIL" tab content – thin render shell delegating to sub-components.
 */
import { useState, useEffect, useRef } from "react";
import { Edit2, Save, X, Loader2, Heart } from "lucide-react";
import { ProfileShareButton } from "./ProfileShareButton";
import { AiBadge } from "@/components/AiBadge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FriendActionButtons } from "@/components/friends/FriendActionButtons";
import { ReportButton } from "@/components/social/ReportButton";
import { Input } from "@/components/ui/input";
import type { UserStatus } from "@/components/StatusIndicator";
import type { EditableProfileData } from "./profile-constants";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileBasicInfo } from "./ProfileBasicInfo";
import { ProfileFieldsGrid } from "./ProfileFieldsGrid";
import { ProfileLookingFor } from "./ProfileLookingFor";
import { ProfileBioStatus } from "./ProfileBioStatus";
import { useDrLove } from "@/hooks/useDrLove";

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
  isBot?: boolean;
}

export function ProfileInfoSection({
  displayData, editData, setEditData, isEditing, isOwnProfile, showDemoMode, userId,
  userStatus, userActivity, lastSeen, memberSince, onEdit, onSave, onCancel, saving, isBot,
}: ProfileInfoSectionProps) {
  const navigate = useNavigate();
  const { score: drLoveScore, message: drLoveMessage, loading: drLoveLoading } = useDrLove(
    !isOwnProfile ? userId : undefined
  );

  return (
    <div id="profile-card-capture" className="bg-card border border-[hsl(var(--lunar-box-border))] overflow-hidden">
      {/* Username header bar */}
      <div className="lunar-box-header px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm uppercase tracking-wide">
            {displayData.username}
          </h1>
          {isBot && <AiBadge />}
        </div>
        <div className="flex items-center gap-1.5">
          {!showDemoMode && (
            <ProfileShareButton targetId="profile-card-capture" username={displayData.username} />
          )}
          {isOwnProfile && !showDemoMode && (
            <>
              {isEditing ? (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="default" onClick={onSave} disabled={saving} className="text-xs h-7 px-3 rounded-none">
                    {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Spara
                  </Button>
                  <Button size="sm" variant="outline" onClick={onCancel} className="text-xs h-7 px-2 rounded-none bg-muted text-foreground border-border">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={onEdit} className="text-xs h-7 px-3 rounded-none bg-muted text-foreground border-border hover:bg-muted/80">
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Redigera
                </Button>
              )}
            </>
          )}
          {showDemoMode && (
            <Button size="sm" onClick={() => navigate("/auth")} className="text-xs h-7 px-3 rounded-none">
              Logga in
            </Button>
          )}
        </div>
      </div>

      {/* Profile content */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <div className="shrink-0">
            <ProfileAvatar
              displayData={displayData}
              editData={editData}
              setEditData={setEditData}
              isEditing={isEditing}
            />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
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
      {(isEditing || displayData.status_message) && (
        <div className="border-t border-border/50 px-4 py-3 text-center bg-muted/20">
          {isEditing ? (
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase mb-1.5">Statusmeddelande</h3>
              <Input
                value={editData.status_message}
                onChange={(e) => setEditData({ ...editData, status_message: e.target.value })}
                className="text-xs max-w-md mx-auto h-8 rounded-none border-border" placeholder="Vad gör du just nu?"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">"{displayData.status_message}"</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isOwnProfile && userId && (
        <div className="bg-muted/30 border-t border-border/50 px-4 py-2.5 flex items-center justify-between">
          <FriendActionButtons targetUserId={userId} targetUsername={displayData.username} />
          <ReportButton contentType="profil" contentId={userId} contentAuthor={displayData.username} />
        </div>
      )}

      {/* Dr. Love */}
      {!isOwnProfile && !drLoveLoading && (
        <DrLoveBar score={drLoveScore} message={drLoveMessage} />
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

/** Animated Dr. Love score counter */
function DrLoveBar({ score, message }: { score: number; message: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [score]);

  const pct = score > 0 ? (displayed / score) * score : 0;

  return (
    <div ref={ref} className="relative border-t border-border/50 px-4 py-3 animate-fade-in overflow-hidden">
      <div
        className="absolute inset-0 bg-accent/10 origin-left transition-none"
        style={{ width: `${pct}%` }}
      />
      <div className="relative flex items-center gap-2 text-xs">
        <Heart className="w-4 h-4 text-accent shrink-0 animate-[pulse_1s_ease-in-out_3]" />
        <span className="font-bold text-accent">DR. LOVE:</span>
        <span className="text-muted-foreground">
          <span className="tabular-nums font-semibold text-foreground">{displayed}%</span>
          {" "}— {message}
        </span>
      </div>
    </div>
  );
}
