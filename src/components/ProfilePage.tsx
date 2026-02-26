import { useState, useEffect } from "react";
import { MapPin, Calendar, Edit2, Save, X, Crown, Loader2 } from "lucide-react";
import { FriendActionButtons } from "./friends/FriendActionButtons";
import { Avatar } from "./Avatar";
import { StatusIndicator, type UserStatus } from "./StatusIndicator";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";
import { AvatarPicker, avatarOptions, type AvatarOption } from "./AvatarPicker";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";
import { useProfile, type ProfileData } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ProfileGuestbook } from "./ProfileGuestbook";
import { VisitorLog } from "./VisitorLog";
import { useProfileVisits } from "@/hooks/useProfileVisits";
import { ClickableUsername } from "./ClickableUsername";
import { ProfileFriendsTab } from "./ProfileFriendsTab";
import { supabase } from "@/integrations/supabase/client";
import { usePresence } from "@/hooks/usePresence";

const occupationOptions = [
  "Student",
  "Högstadiet",
  "Gymnasiet",
  "Universitet",
  "Arbetssökande",
  "Anställd",
  "Egen företagare",
  "Frilansare",
  "Föräldraledig",
  "Pensionär",
  "Annat",
];

const relationshipOptions = [
  "Singel",
  "Upptagen",
  "Helst utan",
  "I ett förhållande",
  "Förlovad",
  "Gift",
  "Det är komplicerat",
  "Öppet förhållande",
  "Vill inte säga",
];

const personalityOptions = [
  "Självsäker",
  "Blyg",
  "Social",
  "Lugn",
  "Energisk",
  "Kreativ",
  "Analytisk",
  "Spontan",
];

const hairColorOptions = [
  "Blond",
  "Ljusblondin",
  "Brunett",
  "Svart",
  "Röd",
  "Färgglada",
  "Grå",
  "Annat",
];

const bodyTypeOptions = [
  "Smal",
  "Normal",
  "Atletisk",
  "Kurvig",
  "Medellång",
  "Annat",
];

const lookingForOptions = [
  "Vänskap",
  "Chatt",
  "Dejting",
  "Nätverkande",
  "Gaming-kompisar",
  "Inget speciellt",
];

const genderOptions = ["Kille", "Tjej", "Annat"];

interface EditableProfileData {
  username: string;
  avatar_url: string | null;
  status_message: string;
  bio: string;
  city: string;
  occupation: string;
  relationship: string;
  personality: string;
  hair_color: string;
  body_type: string;
  clothing: string;
  likes: string;
  eats: string;
  listens_to: string;
  prefers: string;
  looking_for: string[];
  age: number | null;
  gender: string;
  interests: string;
  spanar_in: string;
}

// Demo data for logged out users
const demoProfile: EditableProfileData = {
  username: "demo_alex",
  avatar_url: null,
  status_message: "Living in the 2000s 🦋",
  bio: "Hej! Jag är en demo-profil. Logga in för att skapa din egen profil och börja chatta med andra!",
  city: "Stockholm",
  occupation: "Student",
  relationship: "Singel",
  personality: "Social",
  hair_color: "Brunett",
  body_type: "Normal",
  clothing: "Casual",
  likes: "Musik, gaming, vänner",
  eats: "Pizza",
  listens_to: "Allt möjligt",
  prefers: "Hänga med kompisar",
  looking_for: ["Vänskap", "Chatt"],
  age: 22,
  gender: "Kille",
  interests: "Retro gaming, webbutveckling",
  spanar_in: "Nya vänner",
};

interface ProfilePageProps {
  userId?: string;
}

export function ProfilePage({ userId }: ProfilePageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, saving, isOwnProfile, updateProfile } = useProfile(userId);
  const { visitors } = useProfileVisits(userId);
  const { getUserStatus, getUserActivity } = usePresence();
  
  const isLoggedIn = !!user;
  const showDemoMode = !isLoggedIn && !userId;
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profil" | "gastbok" | "blog" | "vanner" | "album" | "besokare">("profil");
  
  const [editData, setEditData] = useState<EditableProfileData>({
    username: "",
    avatar_url: null,
    status_message: "",
    bio: "",
    city: "",
    occupation: "",
    relationship: "",
    personality: "",
    hair_color: "",
    body_type: "",
    clothing: "",
    likes: "",
    eats: "",
    listens_to: "",
    prefers: "",
    looking_for: [],
    age: null,
    gender: "",
    interests: "",
    spanar_in: "",
  });

  // Update editData when profile loads
  useEffect(() => {
    if (profile) {
      setEditData({
        username: profile.username || "",
        avatar_url: profile.avatar_url,
        status_message: profile.status_message || "",
        bio: profile.bio || "",
        city: profile.city || "",
        occupation: profile.occupation || "",
        relationship: profile.relationship || "",
        personality: profile.personality || "",
        hair_color: profile.hair_color || "",
        body_type: profile.body_type || "",
        clothing: profile.clothing || "",
        likes: profile.likes || "",
        eats: profile.eats || "",
        listens_to: profile.listens_to || "",
        prefers: profile.prefers || "",
        looking_for: profile.looking_for || [],
        age: profile.age,
        gender: profile.gender || "",
        interests: profile.interests || "",
        spanar_in: profile.spanar_in || "",
      });
    }
  }, [profile]);

  // Friends are now handled by ProfileFriendsTab component

  const handleSave = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (profile) {
      setEditData({
        username: profile.username || "",
        avatar_url: profile.avatar_url,
        status_message: profile.status_message || "",
        bio: profile.bio || "",
        city: profile.city || "",
        occupation: profile.occupation || "",
        relationship: profile.relationship || "",
        personality: profile.personality || "",
        hair_color: profile.hair_color || "",
        body_type: profile.body_type || "",
        clothing: profile.clothing || "",
        likes: profile.likes || "",
        eats: profile.eats || "",
        listens_to: profile.listens_to || "",
        prefers: profile.prefers || "",
        looking_for: profile.looking_for || [],
        age: profile.age,
        gender: profile.gender || "",
        interests: profile.interests || "",
        spanar_in: profile.spanar_in || "",
      });
    }
    setIsEditing(false);
  };

  const toggleLookingFor = (option: string) => {
    setEditData((prev) => ({
      ...prev,
      looking_for: prev.looking_for.includes(option)
        ? prev.looking_for.filter((o) => o !== option)
        : [...prev.looking_for, option],
    }));
  };

  const profileTabs = [
    { id: "profil", label: "PROFIL" },
    { id: "gastbok", label: "GÄSTBOK" },
    { id: "blog", label: "BLOG" },
    { id: "vanner", label: "VÄNNER" },
    { id: "album", label: "ALBUM" },
    ...(isOwnProfile ? [{ id: "besokare" as const, label: "BESÖKARE" }] : []),
  ] as const;

  // Dr. Love compatibility score (mock)
  const drLoveScore = 73;

  // Loading state (only when logged in)
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

  // No profile found (only when logged in and looking at specific user)
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

  // Determine what data to show
  const displayData = showDemoMode 
    ? demoProfile 
    : isEditing 
      ? editData 
      : {
          username: profile?.username || "",
          avatar_url: profile?.avatar_url || null,
          status_message: profile?.status_message || "",
          bio: profile?.bio || "",
          city: profile?.city || "",
          occupation: profile?.occupation || "",
          relationship: profile?.relationship || "",
          personality: profile?.personality || "",
          hair_color: profile?.hair_color || "",
          body_type: profile?.body_type || "",
          clothing: profile?.clothing || "",
          likes: profile?.likes || "",
          eats: profile?.eats || "",
          listens_to: profile?.listens_to || "",
          prefers: profile?.prefers || "",
          looking_for: profile?.looking_for || [],
          age: profile?.age || null,
          gender: profile?.gender || "",
          interests: profile?.interests || "",
          spanar_in: profile?.spanar_in || "",
        };

  const profileUserId = profile?.user_id || userId;
  const userStatus: UserStatus = profileUserId ? getUserStatus(profileUserId) : (user ? getUserStatus(user.id) : "offline");
  const userActivity = profileUserId ? getUserActivity(profileUserId) : undefined;
  const memberSince = profile 
    ? new Date(profile.created_at).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' })
    : "December 2025";
  const lastSeen = profile?.last_seen
    ? new Date(profile.last_seen).toLocaleDateString('sv-SE', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    : null;

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

      {/* LunarStorm-style Profile Header Bar */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground">
        <div className="container px-4 py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-display font-bold text-base sm:text-lg uppercase truncate">{displayData.username}</span>
              <span className="text-xs sm:text-sm whitespace-nowrap">
                {displayData.gender && `- ${displayData.gender}`}
                {displayData.age && `, ${displayData.age} ÅR`}
                {displayData.city && `, ${displayData.city.toUpperCase()}`}
              </span>
            </div>
            {isOwnProfile && !showDemoMode && (
              <div className="shrink-0">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                      Spara
                    </Button>
                    <Button size="sm" variant="outline" className="text-foreground" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Redigera
                  </Button>
                )}
              </div>
            )}
            {showDemoMode && (
              <Button size="sm" variant="secondary" onClick={() => navigate("/auth")} className="shrink-0">
                Logga in för att skapa profil
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Sub-navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="container px-4">
          <nav className="flex items-center gap-0.5 py-1 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-2 text-xs font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap min-h-[40px]",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Profile Content */}
      <div className="container px-4 py-4">
        {activeTab === "profil" && (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            {/* Profile Info Section - LunarStorm Style */}
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
                  
                  {/* Avatar Picker (only in edit mode) */}
                  {isEditing && (
                    <>
                      <AvatarPicker
                        selectedAvatarId={editData.avatar_url ? avatarOptions.find(a => a.src === editData.avatar_url)?.id : undefined}
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
                            {displayData.gender || "Ej angivet"}, {displayData.age || "?"} år från <span className="text-primary font-medium">{displayData.city || "Okänt"}</span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIndicator status={userStatus} size="sm" />
                      <span className={cn(
                        "text-xs uppercase font-medium",
                        userStatus === "online" && "text-[hsl(var(--online-green))]",
                        userStatus === "away" && "text-yellow-500",
                        userStatus === "offline" && "text-muted-foreground"
                      )}>
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
                    {/* Activity & Last seen */}
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

                  {/* LunarStorm-style Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                    <ProfileField
                      label="Personlighet:"
                      value={displayData.personality}
                      editValue={editData.personality}
                      isEditing={isEditing}
                      options={personalityOptions}
                      onChange={(v) => setEditData({ ...editData, personality: v })}
                    />
                    <ProfileField
                      label="Civilstånd:"
                      value={displayData.relationship}
                      editValue={editData.relationship}
                      isEditing={isEditing}
                      options={relationshipOptions}
                      onChange={(v) => setEditData({ ...editData, relationship: v })}
                    />
                    <ProfileField
                      label="Sysselsättn.:"
                      value={displayData.occupation}
                      editValue={editData.occupation}
                      isEditing={isEditing}
                      options={occupationOptions}
                      onChange={(v) => setEditData({ ...editData, occupation: v })}
                    />
                    <ProfileField
                      label="Boende:"
                      value={displayData.city}
                      editValue={editData.city}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, city: v })}
                    />
                    <ProfileField
                      label="Föredrar:"
                      value={displayData.prefers}
                      editValue={editData.prefers}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, prefers: v })}
                    />
                    <ProfileField
                      label="Gillar:"
                      value={displayData.likes}
                      editValue={editData.likes}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, likes: v })}
                    />
                    <ProfileField
                      label="Lyssnar På:"
                      value={displayData.listens_to}
                      editValue={editData.listens_to}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, listens_to: v })}
                    />
                    <ProfileField
                      label="Äter helst:"
                      value={displayData.eats}
                      editValue={editData.eats}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, eats: v })}
                    />
                    <ProfileField
                      label="Hårfärg:"
                      value={displayData.hair_color}
                      editValue={editData.hair_color}
                      isEditing={isEditing}
                      options={hairColorOptions}
                      onChange={(v) => setEditData({ ...editData, hair_color: v })}
                    />
                    <ProfileField
                      label="Intressen:"
                      value={displayData.interests}
                      editValue={editData.interests}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, interests: v })}
                    />
                    <ProfileField
                      label="Kläder:"
                      value={displayData.clothing}
                      editValue={editData.clothing}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, clothing: v })}
                    />
                    <ProfileField
                      label="Kropp:"
                      value={displayData.body_type}
                      editValue={editData.body_type}
                      isEditing={isEditing}
                      options={bodyTypeOptions}
                      onChange={(v) => setEditData({ ...editData, body_type: v })}
                    />
                  </div>

                  {/* Looking For Section */}
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
                      ) : (
                        displayData.looking_for.length > 0 ? (
                          displayData.looking_for.map((item) => (
                            <span key={item} className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary border border-primary/20">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Ej angivet</span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Bar - LunarStorm Style */}
            {!isOwnProfile && userId && (
              <div className="bg-gradient-to-r from-muted/50 via-muted to-muted/50 border-t border-border px-4 py-2">
                <FriendActionButtons targetUserId={userId} targetUsername={displayData.username} />
              </div>
            )}

            {/* Dr. Love Section */}
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

            {/* Bio Section */}
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
        )}

        {activeTab === "gastbok" && userId && (
          <div className="bg-card rounded-lg border border-border p-4">
            <ProfileGuestbook 
              profileOwnerId={userId} 
              isOwnProfile={isOwnProfile} 
            />
          </div>
        )}

        {activeTab === "besokare" && isOwnProfile && (
          <div className="bg-card rounded-lg border border-border p-4">
            <VisitorLog visitors={visitors} />
          </div>
        )}

        {activeTab === "vanner" && userId && (
          <div className="bg-card rounded-lg border border-border p-4">
            <ProfileFriendsTab userId={userId} />
          </div>
        )}

        {activeTab === "vanner" && !userId && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">🌟 Inga vänner ännu</p>
          </div>
        )}

        {activeTab === "blog" && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Inga blogginlägg ännu.</p>
          </div>
        )}

        {activeTab === "album" && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">Inga album uppladdade.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for profile fields
function ProfileField({
  label,
  value,
  editValue,
  isEditing,
  options,
  isText,
  onChange,
}: {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  options?: string[];
  isText?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1">
      <span className="text-muted-foreground whitespace-nowrap">{label}</span>
      {isEditing ? (
        isText ? (
          <Input
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 text-xs px-1 flex-1 min-w-0"
            placeholder="..."
          />
        ) : (
          <Select value={editValue || ""} onValueChange={onChange}>
            <SelectTrigger className="h-6 text-xs px-1 flex-1 min-w-0">
              <SelectValue placeholder="Välj..." />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ) : (
        <span className="text-primary truncate">{value || "Ej angivet"}</span>
      )}
    </div>
  );
}
