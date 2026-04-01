/**
 * @module NewVisitorBadge
 * Animated "NY BESÖKARE" badge shown once per visitor–profile pair.
 * Tracks first visits via profile_visits table.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface NewVisitorBadgeProps {
  profileOwnerId: string;
}

export function NewVisitorBadge({ profileOwnerId }: NewVisitorBadgeProps) {
  const { user } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || user.id === profileOwnerId) return;

    let cancelled = false;

    const checkFirstVisit = async () => {
      // Check if we already visited this profile
      const { data } = await supabase
        .from("profile_visits")
        .select("id")
        .eq("visitor_id", user.id)
        .eq("profile_owner_id", profileOwnerId)
        .limit(1);

      if (cancelled) return;

      // If no row exists, this is the first visit → record it and show badge
      if (!data || data.length === 0) {
        await supabase.from("profile_visits").insert({
          visitor_id: user.id,
          profile_owner_id: profileOwnerId,
        });
        if (!cancelled) setShow(true);
      }
    };

    checkFirstVisit();
    return () => { cancelled = true; };
  }, [user, profileOwnerId]);

  // Auto-hide after animation completes
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setShow(false), 3500);
    return () => clearTimeout(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="new-visitor-badge pointer-events-none fixed top-24 right-4 z-50 sm:right-8"
      aria-hidden="true"
    >
      <div className="new-visitor-badge__inner px-4 py-2 border-2 border-[hsl(var(--primary))] bg-[hsl(0_0%_15%/0.88)] rounded shadow-[0_0_16px_hsl(var(--primary)/0.5),0_0_4px_hsl(var(--primary)/0.3)]">
        <span className="block text-[13px] font-bold uppercase tracking-widest text-[hsl(var(--primary))]">
          ✨ Ny besökare ✨
        </span>
      </div>

      <style>{`
        .new-visitor-badge {
          animation: nvb-lifecycle 3.5s ease-out forwards;
        }
        .new-visitor-badge__inner {
          animation: nvb-glow 0.7s ease-in-out 0.4s 3;
        }

        @keyframes nvb-lifecycle {
          0% {
            opacity: 0;
            transform: scale(0) translateY(10px);
          }
          12% {
            opacity: 1;
            transform: scale(1.12) translateY(0);
          }
          18% {
            transform: scale(1) translateY(0);
          }
          75% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.7) translateY(-10px);
          }
        }

        @keyframes nvb-glow {
          0%, 100% {
            box-shadow: 0 0 16px hsl(var(--primary) / 0.5), 0 0 4px hsl(var(--primary) / 0.3);
          }
          50% {
            box-shadow: 0 0 28px hsl(var(--primary) / 0.8), 0 0 8px hsl(var(--primary) / 0.5);
          }
        }
      `}</style>
    </div>
  );
}
