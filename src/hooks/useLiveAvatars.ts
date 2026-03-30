import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeAvatarUrl } from "@/lib/avatar-url";

/**
 * Resolves live avatar URLs from the profiles table for a set of user IDs.
 * Returns a lookup function that prefers the live avatar over any stale
 * denormalized `author_avatar` stored at insert time.
 */
export function useLiveAvatars(userIds: string[]) {
  const [map, setMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (userIds.length === 0) return;
    const unique = [...new Set(userIds)];
    supabase
      .from("profiles")
      .select("user_id, avatar_url")
      .in("user_id", unique)
      .then(({ data }) => {
        if (!data) return;
        const m: Record<string, string | null> = {};
        for (const p of data) m[p.user_id] = p.avatar_url;
        setMap(m);
      });
  }, [userIds.join(",")]);

  /** Get the freshest avatar for a user, falling back to the stored one */
  const getAvatar = (userId: string, storedAvatar: string | null | undefined): string | undefined => {
    const live = map[userId];
    const url = live !== undefined ? live : storedAvatar;
    return sanitizeAvatarUrl(url) || undefined;
  };

  return { getAvatar, avatarMap: map };
}
