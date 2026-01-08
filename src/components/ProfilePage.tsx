import { useState } from "react";
import { MapPin, Calendar, Heart, MessageCircle, Star, Edit2, Save, X } from "lucide-react";
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
  "I ett förhållande",
  "Förlovad",
  "Gift",
  "Det är komplicerat",
  "Öppet förhållande",
  "Vill inte säga",
];

const zodiacOptions = [
  "Väduren ♈",
  "Oxen ♉",
  "Tvillingarna ♊",
  "Kräftan ♋",
  "Lejonet ♌",
  "Jungfrun ♍",
  "Vågen ♎",
  "Skorpionen ♏",
  "Skytten ♐",
  "Stenbocken ♑",
  "Vattumannen ♒",
  "Fiskarna ♓",
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
  occupation: string;
  relationship: string;
  zodiac: string;
  lookingFor: string[];
  age: string;
  interests: string;
}

interface ProfilePageProps {
  isOwnProfile?: boolean;
}

export function ProfilePage({ isOwnProfile = true }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    name: "Alex Johnson",
    username: "alex_echo",
    avatar: undefined,
    status: "online",
    statusMessage: "Living in the 2000s 🦋",
    bio: "Web developer by day, retro gaming enthusiast by night. Miss the days of AIM and MSN! Building cool stuff with modern tech.",
    location: "Stockholm",
    occupation: "Anställd",
    relationship: "Singel",
    zodiac: "Lejonet ♌",
    lookingFor: ["Vänskap", "Chatt"],
    age: "28",
    interests: "Gaming, Musik, Kodning, Retrotech",
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

  return (
    <div className="flex-1 overflow-y-auto scrollbar-nostalgic">
      <section className="container px-4 py-8 max-w-2xl mx-auto">
        <div className="nostalgia-card p-6">
          {/* Header with gradient banner */}
          <div className="relative -mx-6 -mt-6 mb-12 h-24 rounded-t-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
            
            {/* Edit Button */}
            {isOwnProfile && (
              <div className="absolute top-3 right-3">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="msn" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-1" />
                      Spara
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Redigera
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-16 mb-4">
            <div className="relative">
              {isEditing ? (
                <button
                  onClick={() => {}}
                  className="relative group"
                >
                  <Avatar
                    src={editData.avatar}
                    name={editData.name}
                    status={profile.status}
                    size="xl"
                    className="ring-4 ring-card group-hover:ring-primary/50 transition-all"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit2 className="w-6 h-6 text-white" />
                  </div>
                </button>
              ) : (
                <Avatar
                  src={profile.avatar}
                  name={profile.name}
                  status={profile.status}
                  size="xl"
                  className="ring-4 ring-card"
                />
              )}
            </div>
          </div>

          {/* Avatar Picker (only in edit mode) */}
          {isEditing && (
            <AvatarPicker
              selectedAvatarId={editData.avatar ? avatarOptions.find(a => a.src === editData.avatar)?.id : undefined}
              onSelect={(avatar: AvatarOption) => setEditData({ ...editData, avatar: avatar.src })}
              className="mb-6"
            />
          )}

          {/* Profile Info */}
          <div className="text-center">
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="text-center font-display font-bold text-xl mb-2 max-w-xs mx-auto"
              />
            ) : (
              <h2 className="font-display font-bold text-xl">{profile.name}</h2>
            )}
            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <StatusIndicator status={profile.status} size="sm" />
              <span className="text-xs text-muted-foreground capitalize">{profile.status}</span>
            </div>

            {isEditing ? (
              <Input
                value={editData.statusMessage}
                onChange={(e) => setEditData({ ...editData, statusMessage: e.target.value })}
                placeholder="Statusmeddelande..."
                className="text-center text-sm mt-2 max-w-xs mx-auto"
              />
            ) : (
              profile.statusMessage && (
                <p className="text-sm text-muted-foreground italic mt-1">
                  "{profile.statusMessage}"
                </p>
              )
            )}
          </div>

          {/* Bio */}
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Om mig
            </label>
            {isEditing ? (
              <Textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                className="mt-1"
                rows={3}
              />
            ) : (
              <p className="text-sm text-foreground/80 mt-1">{profile.bio}</p>
            )}
          </div>

          {/* LunarStorm-style Profile Fields */}
          <div className="mt-6 space-y-4">
            <h3 className="font-display font-semibold text-sm text-primary border-b border-border pb-2">
              📋 Fakta om mig
            </h3>

            {/* Age & Location Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ålder
                </label>
                {isEditing ? (
                  <Input
                    value={editData.age}
                    onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                    className="mt-1"
                    type="number"
                  />
                ) : (
                  <p className="text-sm mt-1">{profile.age} år</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Bor i
                </label>
                {isEditing ? (
                  <Input
                    value={editData.location}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.location}
                  </p>
                )}
              </div>
            </div>

            {/* Occupation Dropdown */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sysselsättning
              </label>
              {isEditing ? (
                <Select
                  value={editData.occupation}
                  onValueChange={(value) => setEditData({ ...editData, occupation: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Välj sysselsättning" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupationOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">💼 {profile.occupation}</p>
              )}
            </div>

            {/* Relationship Dropdown */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Civilstånd
              </label>
              {isEditing ? (
                <Select
                  value={editData.relationship}
                  onValueChange={(value) => setEditData({ ...editData, relationship: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Välj civilstånd" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">💕 {profile.relationship}</p>
              )}
            </div>

            {/* Zodiac Dropdown */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Stjärntecken
              </label>
              {isEditing ? (
                <Select
                  value={editData.zodiac}
                  onValueChange={(value) => setEditData({ ...editData, zodiac: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Välj stjärntecken" />
                  </SelectTrigger>
                  <SelectContent>
                    {zodiacOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1">{profile.zodiac}</p>
              )}
            </div>

            {/* Interests */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Intressen
              </label>
              {isEditing ? (
                <Input
                  value={editData.interests}
                  onChange={(e) => setEditData({ ...editData, interests: e.target.value })}
                  placeholder="Separera med komma"
                  className="mt-1"
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.interests.split(", ").map((interest, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Looking For - Multi-select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Söker
              </label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {lookingForOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleLookingFor(option)}
                      className={cn(
                        "px-3 py-1.5 text-xs rounded-full border transition-all",
                        editData.lookingFor.includes(option)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.lookingFor.map((item, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 mt-6 py-4 border-y border-border">
            <div className="text-center">
              <p className="font-display font-bold text-lg text-primary">47</p>
              <p className="text-xs text-muted-foreground">Vänner</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-accent">128</p>
              <p className="text-xs text-muted-foreground">Inlägg</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-online">12</p>
              <p className="text-xs text-muted-foreground">Grupper</p>
            </div>
          </div>

          {/* Member since */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Medlem sedan December 2025</span>
          </div>

          {/* Actions for other profiles */}
          {!isOwnProfile && (
            <div className="flex gap-3 mt-6">
              <Button variant="msn" className="flex-1">
                <MessageCircle className="w-4 h-4" />
                Skicka meddelande
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Star className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
