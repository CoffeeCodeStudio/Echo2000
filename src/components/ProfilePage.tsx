import { useState } from "react";
import { MapPin, Calendar, Heart, MessageCircle, Star, Edit2, Save, X, Ban, FileText, Crown } from "lucide-react";
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

interface ProfileData {
  name: string;
  username: string;
  avatar?: string;
  status: UserStatus;
  statusMessage: string;
  bio: string;
  location: string;
  city: string;
  occupation: string;
  relationship: string;
  personality: string;
  hairColor: string;
  bodyType: string;
  clothing: string;
  likes: string;
  eats: string;
  listensTo: string;
  prefers: string;
  lookingFor: string[];
  age: string;
  gender: string;
  interests: string;
  spanarIn: string;
  vipStatus: string;
}

interface ProfilePageProps {
  isOwnProfile?: boolean;
}

export function ProfilePage({ isOwnProfile = true }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profil" | "gastbok" | "blog" | "vanner" | "album" | "besokare">("profil");
  
  const [profile, setProfile] = useState<ProfileData>({
    name: "Alex",
    username: "alex_echo",
    avatar: undefined,
    status: "online",
    statusMessage: "Living in the 2000s 🦋",
    bio: "Web developer by day, retro gaming enthusiast by night.",
    location: "Stockholm",
    city: "Stockholm",
    occupation: "Anställd",
    relationship: "Singel",
    personality: "Självsäker",
    hairColor: "Ljusblondin",
    bodyType: "Medellång",
    clothing: "Färgglada",
    likes: "Tvillingen",
    eats: "Anything..",
    listensTo: "Det mesta",
    prefers: "Vännerna",
    lookingFor: ["Vänskap", "Chatt"],
    age: "28",
    gender: "Kille",
    interests: "Playahead",
    spanarIn: "Lillys",
    vipStatus: "VIP",
  });

  const [editData, setEditData] = useState(profile);

  const handleSave = () => {
    setProfile(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const toggleLookingFor = (option: string) => {
    setEditData((prev) => ({
      ...prev,
      lookingFor: prev.lookingFor.includes(option)
        ? prev.lookingFor.filter((o) => o !== option)
        : [...prev.lookingFor, option],
    }));
  };

  const profileTabs = [
    { id: "profil", label: "PROFIL" },
    { id: "gastbok", label: "GÄSTBOK" },
    { id: "blog", label: "BLOG" },
    { id: "vanner", label: "VÄNNER" },
    { id: "album", label: "ALBUM" },
    { id: "besokare", label: "BESÖKARE" },
  ] as const;

  // Dr. Love compatibility score (mock)
  const drLoveScore = 73;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic bg-background">
      {/* LunarStorm-style Profile Header Bar */}
      <div className="bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground">
        <div className="container px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg uppercase">{profile.username}</span>
              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded font-bold">
                ({profile.vipStatus})
              </span>
              <span className="text-sm">
                - {profile.gender}, {profile.age} ÅR, {profile.city.toUpperCase()}
              </span>
            </div>
            {isOwnProfile && (
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />
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
          </div>
        </div>
      </div>

      {/* Profile Sub-navigation Tabs */}
      <div className="bg-card border-b border-border">
        <div className="container px-4">
          <nav className="flex items-center gap-0.5 py-1 overflow-x-auto">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wide rounded transition-all whitespace-nowrap",
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
                          {editData.avatar ? (
                            <img src={editData.avatar} alt={editData.name} className="w-full h-full object-cover" />
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
                        {profile.avatar ? (
                          <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
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
                    <AvatarPicker
                      selectedAvatarId={editData.avatar ? avatarOptions.find(a => a.src === editData.avatar)?.id : undefined}
                      onSelect={(avatar: AvatarOption) => setEditData({ ...editData, avatar: avatar.src })}
                      className="mt-3 max-w-[140px]"
                    />
                  )}
                </div>

                {/* Center: Basic Info + Fields Grid */}
                <div className="flex-1 min-w-0">
                  {/* Basic Info Row */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-foreground">
                        {isEditing ? (
                          <div className="flex gap-2 items-center">
                            <Select value={editData.gender} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                              <SelectTrigger className="w-24 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Kille">Kille</SelectItem>
                                <SelectItem value="Tjej">Tjej</SelectItem>
                                <SelectItem value="Annat">Annat</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={editData.age}
                              onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                              className="w-16 h-7 text-xs"
                              type="number"
                            />
                            <span className="text-sm">år från</span>
                            <Input
                              value={editData.city}
                              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                              className="w-28 h-7 text-xs"
                            />
                          </div>
                        ) : (
                          <span className="text-sm">
                            {profile.gender}, {profile.age} år från <span className="text-primary font-medium">{profile.city}</span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIndicator status={profile.status} size="sm" />
                      <span className="text-xs uppercase text-[hsl(var(--online-green))] font-medium">
                        {profile.status === "online" ? "ONLINE" : profile.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        - spanar in{" "}
                        {isEditing ? (
                          <Input
                            value={editData.spanarIn}
                            onChange={(e) => setEditData({ ...editData, spanarIn: e.target.value })}
                            className="inline-block w-24 h-5 text-xs px-1"
                          />
                        ) : (
                          <span className="text-primary">{profile.spanarIn}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* VIP Badge */}
                  <div className="absolute top-4 right-4 hidden md:block">
                    <div className="bg-accent text-accent-foreground px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {profile.vipStatus}
                    </div>
                  </div>

                  {/* LunarStorm-style Fields Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                    <ProfileField
                      label="Personlighet:"
                      value={profile.personality}
                      editValue={editData.personality}
                      isEditing={isEditing}
                      options={personalityOptions}
                      onChange={(v) => setEditData({ ...editData, personality: v })}
                    />
                    <ProfileField
                      label="Civilstånd:"
                      value={profile.relationship}
                      editValue={editData.relationship}
                      isEditing={isEditing}
                      options={relationshipOptions}
                      onChange={(v) => setEditData({ ...editData, relationship: v })}
                    />
                    <ProfileField
                      label="Sysselsättn.:"
                      value={profile.occupation}
                      editValue={editData.occupation}
                      isEditing={isEditing}
                      options={occupationOptions}
                      onChange={(v) => setEditData({ ...editData, occupation: v })}
                    />
                    <ProfileField
                      label="Boende:"
                      value={profile.location}
                      editValue={editData.location}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, location: v })}
                    />
                    <ProfileField
                      label="Föredrar:"
                      value={profile.prefers}
                      editValue={editData.prefers}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, prefers: v })}
                    />
                    <ProfileField
                      label="Gillar:"
                      value={profile.likes}
                      editValue={editData.likes}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, likes: v })}
                    />
                    <ProfileField
                      label="Lyssnar På:"
                      value={profile.listensTo}
                      editValue={editData.listensTo}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, listensTo: v })}
                    />
                    <ProfileField
                      label="Äter helst:"
                      value={profile.eats}
                      editValue={editData.eats}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, eats: v })}
                    />
                    <ProfileField
                      label="Hårfärg:"
                      value={profile.hairColor}
                      editValue={editData.hairColor}
                      isEditing={isEditing}
                      options={hairColorOptions}
                      onChange={(v) => setEditData({ ...editData, hairColor: v })}
                    />
                    <ProfileField
                      label="Intressen:"
                      value={profile.interests}
                      editValue={editData.interests}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, interests: v })}
                    />
                    <ProfileField
                      label="Kläder:"
                      value={profile.clothing}
                      editValue={editData.clothing}
                      isEditing={isEditing}
                      isText
                      onChange={(v) => setEditData({ ...editData, clothing: v })}
                    />
                    <ProfileField
                      label="Kropp:"
                      value={profile.bodyType}
                      editValue={editData.bodyType}
                      isEditing={isEditing}
                      options={bodyTypeOptions}
                      onChange={(v) => setEditData({ ...editData, bodyType: v })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Bar - LunarStorm Style */}
            {!isOwnProfile && (
              <div className="bg-gradient-to-r from-muted/50 via-muted to-muted/50 border-t border-border px-4 py-2">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
                    <Heart className="w-3 h-3 mr-1" />
                    Skapa Relation
                  </Button>
                  <span className="text-muted-foreground">|</span>
                  <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    Skicka Mess
                  </Button>
                  <span className="text-muted-foreground">|</span>
                  <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
                    <Ban className="w-3 h-3 mr-1" />
                    Blockera
                  </Button>
                  <span className="text-muted-foreground">|</span>
                  <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
                    <FileText className="w-3 h-3 mr-1" />
                    Anteckningar
                  </Button>
                  <span className="text-muted-foreground">|</span>
                  <Button variant="link" size="sm" className="text-primary h-auto py-1 px-2 uppercase font-bold">
                    <Crown className="w-3 h-3 mr-1" />
                    Köp Ikon
                  </Button>
                </div>
              </div>
            )}

            {/* Dr. Love Section */}
            <div className="bg-muted/30 border-t border-border px-4 py-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-accent">DR. LOVE:</span>
                <span className="text-muted-foreground">
                  {drLoveScore}% kan funka om du klär ut dig till chimpans och drar ett skämt!
                </span>
              </div>
            </div>

            {/* Bio Section */}
            <div className="border-t border-border p-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-2">Om mig</h3>
              {isEditing ? (
                <Textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-foreground/80">{profile.bio}</p>
              )}
            </div>

            {/* Stats Section */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center justify-around text-center">
                <div>
                  <p className="font-display font-bold text-lg text-primary">47</p>
                  <p className="text-xs text-muted-foreground">Vänner</p>
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-accent">128</p>
                  <p className="text-xs text-muted-foreground">Inlägg</p>
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-[hsl(var(--online-green))]">892</p>
                  <p className="text-xs text-muted-foreground">Besökare</p>
                </div>
                <div>
                  <p className="font-display font-bold text-lg text-foreground">12</p>
                  <p className="text-xs text-muted-foreground">Grupper</p>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="border-t border-border px-4 py-2 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Medlem sedan December 2025</span>
              </div>
            </div>
          </div>
        )}

        {activeTab !== "profil" && (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">
              {activeTab === "gastbok" && "Gästboken är tom... Var först att skriva!"}
              {activeTab === "blog" && "Inga blogginlägg ännu."}
              {activeTab === "vanner" && "Vänlistan visas här."}
              {activeTab === "album" && "Inga album uppladdade."}
              {activeTab === "besokare" && "Senaste besökarna visas här."}
            </p>
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
          />
        ) : (
          <Select value={editValue} onValueChange={onChange}>
            <SelectTrigger className="h-6 text-xs px-1 flex-1 min-w-0">
              <SelectValue />
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
        <span className="text-primary truncate">{value}</span>
      )}
    </div>
  );
}
