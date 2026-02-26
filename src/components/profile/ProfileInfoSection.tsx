import { Edit2, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AvatarPicker, avatarOptions, type AvatarOption } from "@/components/AvatarPicker";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { FriendActionButtons } from "@/components/friends/FriendActionButtons";
import { StatusIndicator, type UserStatus } from "@/components/StatusIndicator";
import { ProfileField } from "./ProfileField";
import {
  type EditableProfileData,
  genderOptions,
  personalityOptions,
  relationshipOptions,
  occupationOptions,
  hairColorOptions,
  bodyTypeOptions,
  lookingForOptions,
} from "./profile-constants";

interface ProfileInfoSectionProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  isOwnProfile: boolean;
  userId?: string;
  userStatus: UserStatus;
  userActivity?: string;
  lastSeen: string | null;
  memberSince: string;
}

/**
 * The main "PROFIL" tab content — avatar, basic info fields grid, looking-for
 * tags, friend action buttons, Dr. Love, bio, status message, and member-since.
 */
export function ProfileInfoSection({
  displayData,
  editData,
  setEditData,
  isEditing,
  isOwnProfile,
  userId,
  userStatus,
  userActivity,
  lastSeen,
  memberSince,
}: ProfileInfoSectionProps) {
  const toggleLookingFor = (option: string) => {
    setEditData((prev) => ({
      ...prev,
      looking_for: prev.looking_for.includes(option)
        ? prev.looking_for.filter((o) => o !== option)
        : [...prev.looking_for, option],
    }));
  };

  const drLoveScore = 73;

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Profile Info Section */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              {isEditing ? (
                <button onClick={() => {}} className="relative group">
                  <div className="w-32 h-40 bg-muted rounded-lg overflow-hidden border-2 border-border group-hover:border-primary/50 transition-all">
                    {editData.avatar_url ? (
                      <img src={editData.avatar_url} alt={editData.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                        INGET FOTO
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                </button>
              ) : (
                <div className="w-32 h-40 bg-muted rounded-lg overflow-hidden border-2 border-border">
                  {displayData.avatar_url ? (
                    <img src={displayData.avatar_url} alt={displayData.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                      INGET FOTO
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEditing && (
              <>
                <AvatarPicker
                  selectedAvatarId={editData.avatar_url ? avatarOptions.find((a) => a.src === editData.avatar_url)?.id : undefined}
                  onSelect={(avatar: AvatarOption) => setEditData({ ...editData, avatar_url: avatar.src })}
                  className="mt-3 max-w-[140px]"
                />
                <ProfilePhotoUpload onUploadComplete={() => {}} />
              </>
            )}
          </div>

          {/* Center: Basic Info + Fields Grid */}
          <div className="flex-1 min-w-0">
            {/* Basic Info Row */}
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-foreground">
                  {isEditing ? (
                    <div className="flex gap-2 items-center flex-wrap">
                      <Select value={editData.gender || ""} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue placeholder="Kön" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={editData.age?.toString() || ""}
                        onChange={(e) => setEditData({ ...editData, age: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-16 h-7 text-xs"
                        type="number"
                        placeholder="Ålder"
                      />
                      <span className="text-sm">år från</span>
                      <Input
                        value={editData.city}
                        onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                        className="w-28 h-7 text-xs"
                        placeholder="Stad"
                      />
                    </div>
                  ) : (
                    <span className="text-sm">
                      {displayData.gender || "Ej angivet"}, {displayData.age || "?"} år från{" "}
                      <span className="text-primary font-medium">{displayData.city || "Okänt"}</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StatusIndicator status={userStatus} size="sm" />
                <span
                  className={cn(
                    "text-xs uppercase font-medium",
                    userStatus === "online" && "text-[hsl(var(--online-green))]",
                    userStatus === "away" && "text-yellow-500",
                    userStatus === "offline" && "text-muted-foreground"
                  )}
                >
                  {userStatus === "online" ? "ONLINE" : userStatus === "away" ? "BORTA" : "OFFLINE"}
                </span>
                <span className="text-xs text-muted-foreground">
                  - spanar in{" "}
                  {isEditing ? (
                    <Input
                      value={editData.spanar_in}
                      onChange={(e) => setEditData({ ...editData, spanar_in: e.target.value })}
                      className="inline-block w-24 h-5 text-xs px-1"
                      placeholder="..."
                    />
                  ) : (
                    <span className="text-primary">{displayData.spanar_in || "..."}</span>
                  )}
                </span>
              </div>
              {userStatus !== "offline" && userActivity && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-muted-foreground">🎮 Just nu:</span>
                  <span className="text-xs text-primary font-medium">{userActivity}</span>
                </div>
              )}
              {userStatus === "offline" && lastSeen && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs text-muted-foreground">🕐 Senast inloggad:</span>
                  <span className="text-xs text-muted-foreground">{lastSeen}</span>
                </div>
              )}
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              <ProfileField label="Personlighet:" value={displayData.personality} editValue={editData.personality} isEditing={isEditing} options={personalityOptions} onChange={(v) => setEditData({ ...editData, personality: v })} />
              <ProfileField label="Civilstånd:" value={displayData.relationship} editValue={editData.relationship} isEditing={isEditing} options={relationshipOptions} onChange={(v) => setEditData({ ...editData, relationship: v })} />
              <ProfileField label="Sysselsättn.:" value={displayData.occupation} editValue={editData.occupation} isEditing={isEditing} options={occupationOptions} onChange={(v) => setEditData({ ...editData, occupation: v })} />
              <ProfileField label="Boende:" value={displayData.city} editValue={editData.city} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, city: v })} />
              <ProfileField label="Föredrar:" value={displayData.prefers} editValue={editData.prefers} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, prefers: v })} />
              <ProfileField label="Gillar:" value={displayData.likes} editValue={editData.likes} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, likes: v })} />
              <ProfileField label="Lyssnar På:" value={displayData.listens_to} editValue={editData.listens_to} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, listens_to: v })} />
              <ProfileField label="Äter helst:" value={displayData.eats} editValue={editData.eats} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, eats: v })} />
              <ProfileField label="Hårfärg:" value={displayData.hair_color} editValue={editData.hair_color} isEditing={isEditing} options={hairColorOptions} onChange={(v) => setEditData({ ...editData, hair_color: v })} />
              <ProfileField label="Intressen:" value={displayData.interests} editValue={editData.interests} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, interests: v })} />
              <ProfileField label="Kläder:" value={displayData.clothing} editValue={editData.clothing} isEditing={isEditing} isText onChange={(v) => setEditData({ ...editData, clothing: v })} />
              <ProfileField label="Kropp:" value={displayData.body_type} editValue={editData.body_type} isEditing={isEditing} options={bodyTypeOptions} onChange={(v) => setEditData({ ...editData, body_type: v })} />
            </div>

            {/* Looking For */}
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">Letar efter:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {isEditing ? (
                  lookingForOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleLookingFor(option)}
                      className={cn(
                        "px-2 py-0.5 text-xs rounded border transition-all",
                        editData.looking_for.includes(option)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {option}
                    </button>
                  ))
                ) : displayData.looking_for.length > 0 ? (
                  displayData.looking_for.map((item) => (
                    <span key={item} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/20">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Ej angivet</span>
                )}
              </div>
            </div>
          </div>
        </div>
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

      {/* Bio */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Om mig</h3>
        {isEditing ? (
          <Textarea
            value={editData.bio}
            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
            rows={3}
            className="text-sm"
            placeholder="Berätta lite om dig själv..."
          />
        ) : (
          <p className="text-sm text-foreground/80">{displayData.bio || "Ingen beskrivning ännu..."}</p>
        )}
      </div>

      {/* Status Message */}
      <div className="border-t border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Statusmeddelande</h3>
        {isEditing ? (
          <Input
            value={editData.status_message}
            onChange={(e) => setEditData({ ...editData, status_message: e.target.value })}
            className="text-sm"
            placeholder="Vad gör du just nu?"
          />
        ) : (
          <p className="text-sm text-foreground/80 italic">
            {displayData.status_message ? `"${displayData.status_message}"` : "Inget statusmeddelande"}
          </p>
        )}
      </div>

      {/* Member Since */}
      <div className="border-t border-border px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>Medlem sedan {memberSince}</span>
        </div>
      </div>
    </div>
  );
}
