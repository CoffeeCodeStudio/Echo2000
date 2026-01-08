import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GoodVibeProps {
  targetType: string;
  targetId: string;
  className?: string;
}

// Custom soft glowing dot icon - the "glödpunkt"
function GlowDot({ isVibed, size = "md" }: { isVibed: boolean; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  
  return (
    <div 
      className={cn(
        "relative rounded-full transition-all duration-500",
        sizeClasses,
        isVibed 
          ? "bg-[hsl(32,95%,55%)]" 
          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
      )}
    >
      {isVibed && (
        <>
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-[hsl(32,95%,65%)] blur-[2px] opacity-80" />
          {/* Outer glow */}
          <div className="absolute -inset-1 rounded-full bg-[hsl(32,95%,55%)] blur-[4px] opacity-40" />
          {/* Core */}
          <div className="absolute inset-[2px] rounded-full bg-[hsl(45,100%,85%)]" />
        </>
      )}
    </div>
  );
}

export function GoodVibe({ targetType, targetId, className }: GoodVibeProps) {
  const [hasVibes, setHasVibes] = useState(false);
  const [hasUserVibed, setHasUserVibed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    checkVibes();
  }, [targetType, targetId, userId]);

  const checkVibes = async () => {
    // Check if target has any vibes
    const { data: vibeCount } = await supabase.rpc('count_good_vibes', {
      p_target_type: targetType,
      p_target_id: targetId
    });
    
    setHasVibes((vibeCount || 0) > 0);

    // Check if current user has vibed
    if (userId) {
      const { data: userVibed } = await supabase.rpc('has_user_vibed', {
        p_target_type: targetType,
        p_target_id: targetId
      });
      setHasUserVibed(!!userVibed);
    }
  };

  const giveVibe = async () => {
    if (!userId) {
      toast({
        title: "Logga in",
        description: "Du måste vara inloggad för att ge Good-Vibes.",
        variant: "destructive"
      });
      return;
    }

    if (hasUserVibed) {
      return; // Already vibed, cannot undo
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('give_good_vibe', {
        p_target_type: targetType,
        p_target_id: targetId
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; vibes_remaining?: number };

      if (result.success) {
        setHasUserVibed(true);
        setHasVibes(true);
        setShowConfirmation(true);
        
        // Hide confirmation after 3 seconds
        setTimeout(() => setShowConfirmation(false), 3000);
        
        toast({
          title: "Du gav en Good-Vibe",
          description: result.vibes_remaining !== undefined 
            ? `${result.vibes_remaining} Good-Vibes kvar denna månad`
            : undefined
        });
      } else if (result.error === 'no_vibes_left') {
        toast({
          title: "Inga Good-Vibes kvar",
          description: "Du har använt alla dina Good-Vibes denna månad.",
          variant: "destructive"
        });
      } else if (result.error === 'already_vibed') {
        setHasUserVibed(true);
      }
    } catch (error) {
      console.error('Error giving vibe:', error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte ge Good-Vibe just nu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={giveVibe}
        disabled={isLoading || hasUserVibed}
        className={cn(
          "flex items-center gap-2 text-xs transition-all duration-300 group",
          hasUserVibed 
            ? "text-primary cursor-default" 
            : "text-muted-foreground hover:text-foreground cursor-pointer",
          isLoading && "opacity-50"
        )}
        title={hasUserVibed ? "Du har gett en Good-Vibe" : "Ge en Good-Vibe"}
      >
        <GlowDot isVibed={hasUserVibed} />
        
        {/* Subtle text instead of numbers */}
        {hasVibes && (
          <span className="text-muted-foreground/70 italic">
            {hasUserVibed ? "Du gav en Good-Vibe" : "Fick Good-Vibes"}
          </span>
        )}
      </button>

      {/* Confirmation message - subtle fade in/out */}
      {showConfirmation && (
        <div className="absolute left-0 -top-8 text-xs text-primary animate-fade-in whitespace-nowrap">
          ✨ Du gav en Good-Vibe
        </div>
      )}
    </div>
  );
}

// Component to show Good-Vibe allowance status
export function GoodVibeStatus() {
  const [allowance, setAllowance] = useState<{
    monthly: number;
    used: number;
    isPaid: boolean;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAllowance();
    }
  }, [userId]);

  const fetchAllowance = async () => {
    const { data, error } = await supabase
      .from('good_vibe_allowances')
      .select('monthly_allowance, vibes_used_this_month, is_paid_user')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setAllowance({
        monthly: data.monthly_allowance,
        used: data.vibes_used_this_month,
        isPaid: data.is_paid_user
      });
    } else {
      // Default for users without allowance record
      setAllowance({ monthly: 0, used: 0, isPaid: false });
    }
  };

  if (!userId || !allowance) return null;

  const remaining = Math.max(0, allowance.monthly - allowance.used);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <GlowDot isVibed={remaining > 0} size="sm" />
      <span>
        {remaining} Good-Vibes kvar
        {!allowance.isPaid && remaining === 0 && (
          <span className="ml-1 text-primary/70">(Bli medlem för fler)</span>
        )}
      </span>
    </div>
  );
}
