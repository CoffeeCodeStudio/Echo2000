import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { UserStatus } from '@/components/StatusIndicator';

interface PresenceState {
  user_id: string;
  last_active: string;
}

const AWAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_THROTTLE_MS = 30 * 1000; // Throttle activity updates to every 30s
const CHANNEL_NAME = 'echo2000-presence';

/**
 * Hook to manage user presence (online/away/offline) using Supabase Realtime Presence.
 * - Tracks the current user as online
 * - Detects away status after 5 minutes of inactivity
 * - Returns a map of online user statuses
 */
export function usePresence() {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserStatus>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const lastTrackRef = useRef<number>(0);

  // Track user activity (mouse, keyboard, touch)
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Periodically update presence and check away status
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: user.id } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const statusMap = new Map<string, UserStatus>();

        for (const [userId, presences] of Object.entries(state)) {
          if (presences && presences.length > 0) {
            const lastActive = new Date(presences[0].last_active).getTime();
            const isAway = Date.now() - lastActive > AWAY_TIMEOUT_MS;
            statusMap.set(userId, isAway ? 'away' : 'online');
          }
        }

        setOnlineUsers(statusMap);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            last_active: new Date().toISOString(),
          });
        }
      });

    // Periodically update last_active to reflect activity + update last_seen in DB
    const activityInterval = setInterval(async () => {
      if (!channelRef.current) return;
      
      const now = Date.now();
      // Only track if enough time has passed since last track
      if (now - lastTrackRef.current < ACTIVITY_THROTTLE_MS) return;
      
      lastTrackRef.current = now;
      await channelRef.current.track({
        user_id: user.id,
        last_active: new Date(lastActivityRef.current).toISOString(),
      });

      // Update last_seen in profiles for "recently online" feature
      supabase
        .from("profiles")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_id", user.id)
        .then(() => {});
    }, ACTIVITY_THROTTLE_MS);

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      clearInterval(activityInterval);
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, handleActivity]);

  /**
   * Get the status for a specific user ID.
   * Returns 'offline' if user is not in the presence channel.
   */
  const getUserStatus = useCallback(
    (userId: string): UserStatus => {
      return onlineUsers.get(userId) || 'offline';
    },
    [onlineUsers]
  );

  return {
    onlineUsers,
    getUserStatus,
  };
}
