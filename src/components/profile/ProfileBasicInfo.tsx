/**
 * @module ProfileBasicInfo
 * Inline display/edit for gender, age, city, status, spanar_in, and activity.
 */
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { StatusIndicator, type UserStatus } from "@/components/StatusIndicator";
import { genderOptions, ageOptions, länOptions, getCitiesForLän, svenskaLän, type EditableProfileData } from "./profile-constants";

interface ProfileBasicInfoProps {
  displayData: EditableProfileData;
  editData: EditableProfileData;
  setEditData: React.Dispatch<React.SetStateAction<EditableProfileData>>;
  isEditing: boolean;
  userStatus: UserStatus;
  userActivity?: string;
  lastSeen: string | null;
}

/** Try to detect which län a city belongs to (for existing profiles). */
function detectLän(city: string): string {
  if (!city) return "";
  for (const [län, cities] of Object.entries(svenskaLän)) {
    if (cities.some((c) => c.toLowerCase() === city.toLowerCase())) return län;
  }
  return "";
}

export function ProfileBasicInfo({
  displayData, editData, setEditData, isEditing, userStatus, userActivity, lastSeen,
}: ProfileBasicInfoProps) {

  // Parse län from city for existing data
  const currentLän = useMemo(() => detectLän(editData.city), [editData.city]);
  const availableCities = useMemo(() => getCitiesForLän(currentLän), [currentLän]);

  const handleLänChange = (län: string) => {
    const cities = getCitiesForLän(län);
    // Auto-select first city when changing län
    setEditData((prev) => ({ ...prev, city: cities[0] || "" }));
  };

  const handleCityChange = (city: string) => {
    setEditData((prev) => ({ ...prev, city }));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-foreground">
          {isEditing ? (
            <div className="flex gap-2 items-center flex-wrap">
              <Select value={editData.gender || ""} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                <SelectTrigger className="w-24 h-7 text-xs"><SelectValue placeholder="Kön" /></SelectTrigger>
                <SelectContent>
                  {genderOptions.map((g) => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={editData.age?.toString() || ""} onValueChange={(v) => setEditData({ ...editData, age: v ? parseInt(v) : null })}>
                <SelectTrigger className="w-20 h-7 text-xs"><SelectValue placeholder="Ålder" /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {ageOptions.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                </SelectContent>
              </Select>
              <span className="text-sm">år från</span>
              <Select value={currentLän} onValueChange={handleLänChange}>
                <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="Välj län..." /></SelectTrigger>
                <SelectContent className="max-h-48">
                  {länOptions.map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
              {availableCities.length > 0 && (
                <Select value={editData.city} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-32 h-7 text-xs"><SelectValue placeholder="Välj stad..." /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {availableCities.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
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
            <Input value={editData.spanar_in} onChange={(e) => setEditData({ ...editData, spanar_in: e.target.value })} className="inline-block w-24 h-5 text-xs px-1" placeholder="..." />
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
  );
}
