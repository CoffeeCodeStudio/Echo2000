import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AvatarPicker, avatarOptions, type AvatarOption } from "./AvatarPicker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const genderOptions = ["Kille", "Tjej", "Annat"];

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isValid = gender && city && age;

  const handleSubmit = async () => {
    if (!isValid) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          gender,
          city,
          age: parseInt(age),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Profil sparad!",
        description: "Välkommen till Echo2000!",
      });
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Fel",
        description: "Kunde inte spara profilen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="nostalgia-card max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="font-display font-black text-2xl tracking-tight mb-2">
            <span className="text-foreground">ECHO</span>
            <span className="text-primary-foreground bg-primary px-2 rounded">2000</span>
          </div>
          <h1 className="font-bold text-lg mt-4">Välkommen! 🎉</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fyll i din profil för att komma igång
          </p>
        </div>

        <div className="space-y-4">
          {/* Gender */}
          <div className="space-y-2">
            <Label>Kön *</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Välj kön..." />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label>Stad *</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Din stad..."
              maxLength={100}
            />
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label>Ålder *</Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Din ålder..."
              min={13}
              max={99}
            />
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <Label>Välj en avatar</Label>
            <AvatarPicker
              selectedAvatarId={avatarUrl ? avatarOptions.find(a => a.src === avatarUrl)?.id : undefined}
              onSelect={(avatar: AvatarOption) => setAvatarUrl(avatar.src)}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="w-full mt-6"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sparar...
            </>
          ) : (
            "Fortsätt till Echo2000"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          * Obligatoriska fält
        </p>
      </div>
    </div>
  );
}
