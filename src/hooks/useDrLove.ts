/**
 * @module useDrLove
 * Calculates a compatibility score between the logged-in user and a profile owner.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DrLoveResult {
  score: number;
  message: string;
  loading: boolean;
}

/** Split a comma-separated or multi-value field into lowercase trimmed tokens */
function tokenize(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function getDrLoveMessage(score: number): string {
  if (score >= 80) return "Ödet har talat! Spring mot den personen NU! 🏃💨";
  if (score >= 60) return "Klart du ska chansa! Värsta som kan hända är ett nej haha";
  if (score >= 40) return "Kan funka om ni båda gillar kebab och dåliga filmer 🍕";
  if (score >= 20) return "Tveksamt... men kärleken är blind som de säger?";
  return "Ni är som vatten och olja — men stranger things have happened 👀";
}

export function useDrLove(targetUserId?: string): DrLoveResult {
  const { user } = useAuth();
  const [score, setScore] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !targetUserId || user.id === targetUserId) {
      setLoading(false);
      return;
    }

    const calculate = async () => {
      setLoading(true);
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("interests, listens_to, city, relationship, gender, looking_for")
          .in("user_id", [user.id, targetUserId]);

        if (!profiles || profiles.length < 2) {
          setLoading(false);
          return;
        }

        const mine = profiles.find((_, i) => {
          // Match by checking which profile belongs to the viewer
          // We fetched both, so we need to identify them
          return true;
        });

        // Re-fetch individually for clarity
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("interests, listens_to, city, relationship, gender, looking_for")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: theirProfile } = await supabase
          .from("profiles")
          .select("interests, listens_to, city, relationship, gender, looking_for")
          .eq("user_id", targetUserId)
          .maybeSingle();

        if (!myProfile || !theirProfile) {
          setLoading(false);
          return;
        }

        let compatScore = 0;

        // Interests — 15% per match, max 30%
        const myInterests = tokenize(myProfile.interests);
        const theirInterests = tokenize(theirProfile.interests);
        const sharedInterests = myInterests.filter((i) => theirInterests.includes(i)).length;
        compatScore += Math.min(sharedInterests * 15, 30);

        // Music — matching genres add 10%
        const myMusic = tokenize(myProfile.listens_to);
        const theirMusic = tokenize(theirProfile.listens_to);
        const sharedMusic = myMusic.filter((m) => theirMusic.includes(m)).length;
        compatScore += Math.min(sharedMusic * 10, 10);

        // City — same city adds 10%
        if (
          myProfile.city &&
          theirProfile.city &&
          myProfile.city.toLowerCase().trim() === theirProfile.city.toLowerCase().trim()
        ) {
          compatScore += 10;
        }

        // Relationship — compatible statuses add 10%
        const singleStatuses = ["singel", "single", "det är komplicerat", ""];
        if (
          singleStatuses.includes((myProfile.relationship || "").toLowerCase()) &&
          singleStatuses.includes((theirProfile.relationship || "").toLowerCase())
        ) {
          compatScore += 10;
        }

        // Gender + looking_for — compatible match adds 20%
        const myGender = (myProfile.gender || "").toLowerCase();
        const theirGender = (theirProfile.gender || "").toLowerCase();
        const myLookingFor: string[] = (myProfile.looking_for || []).map((s: string) => s.toLowerCase());
        const theirLookingFor: string[] = (theirProfile.looking_for || []).map((s: string) => s.toLowerCase());

        const iLookForThem =
          myLookingFor.length === 0 ||
          myLookingFor.some((l) => l.includes("vänskap") || l.includes("chatt") || theirGender.includes(l) || l.includes(theirGender));
        const theyLookForMe =
          theirLookingFor.length === 0 ||
          theirLookingFor.some((l) => l.includes("vänskap") || l.includes("chatt") || myGender.includes(l) || l.includes(myGender));

        if (iLookForThem && theyLookForMe) {
          compatScore += 20;
        }

        // Random factor ±5%
        const randomFactor = Math.floor(Math.random() * 11) - 5;
        compatScore += randomFactor;

        // Clamp 10-99
        const finalScore = Math.max(10, Math.min(99, compatScore));
        setScore(finalScore);
      } catch (err) {
        console.error("Dr. Love calculation error:", err);
      } finally {
        setLoading(false);
      }
    };

    calculate();
  }, [user, targetUserId]);

  return { score, message: getDrLoveMessage(score), loading };
}
