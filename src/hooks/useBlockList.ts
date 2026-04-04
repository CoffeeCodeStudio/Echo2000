/**
 * @module useBlockList
 * Manages the current user's block list — fetch, add, remove, and check.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useBlockList() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    if (!user) {
      setBlockedIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("block_list")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    setBlockedIds(new Set((data || []).map((r: any) => r.blocked_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const blockUser = useCallback(async (blockedId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("block_list")
      .insert({ blocker_id: user.id, blocked_id: blockedId });
    if (error) return false;
    setBlockedIds((prev) => new Set([...prev, blockedId]));
    return true;
  }, [user]);

  const unblockUser = useCallback(async (blockedId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("block_list")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);
    if (error) return false;
    setBlockedIds((prev) => {
      const next = new Set(prev);
      next.delete(blockedId);
      return next;
    });
    return true;
  }, [user]);

  const isBlocked = useCallback(
    (userId: string) => blockedIds.has(userId),
    [blockedIds]
  );

  return { blockedIds, loading, blockUser, unblockUser, isBlocked, refetch: fetchBlocks };
}
