import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PendingRequest {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  category: string;
  senderProfile: {
    username: string;
    avatar_url: string | null;
    city: string | null;
    age: number | null;
    gender: string | null;
  };
  mutualFriendsCount: number;
}

export function usePendingFriendRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      // Get pending requests where current user is the recipient (friend_id)
      const { data: pending, error } = await supabase
        .from('friends')
        .select('id, user_id, friend_id, created_at, category')
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!pending || pending.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const senderIds = pending.map((p) => p.user_id);

      // Fetch sender profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, city, age, gender')
        .in('user_id', senderIds);

      // Fetch mutual friends count for each sender
      // Get all accepted friends of current user
      const { data: myFriends } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      const myFriendIds = new Set(
        (myFriends || []).map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))
      );

      const result: PendingRequest[] = [];

      for (const p of pending) {
        const profile = profiles?.find((pr) => pr.user_id === p.user_id);

        // Count mutual friends: friends of the sender who are also my friends
        let mutualCount = 0;
        if (myFriendIds.size > 0) {
          const { data: senderFriends } = await supabase
            .from('friends')
            .select('user_id, friend_id')
            .eq('status', 'accepted')
            .or(`user_id.eq.${p.user_id},friend_id.eq.${p.user_id}`);

          if (senderFriends) {
            const senderFriendIds = senderFriends.map((f) =>
              f.user_id === p.user_id ? f.friend_id : f.user_id
            );
            mutualCount = senderFriendIds.filter((id) => myFriendIds.has(id)).length;
          }
        }

        result.push({
          ...p,
          senderProfile: {
            username: profile?.username || 'Okänd',
            avatar_url: profile?.avatar_url || null,
            city: profile?.city || null,
            age: profile?.age || null,
            gender: profile?.gender || null,
          },
          mutualFriendsCount: mutualCount,
        });
      }

      setRequests(result);
    } catch (err) {
      console.error('Error fetching pending friend requests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();

    if (!user) return;

    const channel = supabase
      .channel('pending-friend-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, fetchRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  const acceptRequest = async (requestId: string, category?: string | null, howMet?: string | null) => {
    try {
      const updateData: Record<string, unknown> = { status: 'accepted' };
      if (category) updateData.category = category;
      if (howMet) updateData.how_met = howMet;

      const { error } = await supabase
        .from('friends')
        .update(updateData as any)
        .eq('id', requestId);

      if (error) throw error;

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return true;
    } catch (err) {
      console.error('Error accepting friend request:', err);
      return false;
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      return true;
    } catch (err) {
      console.error('Error declining friend request:', err);
      return false;
    }
  };

  return {
    requests,
    loading,
    acceptRequest,
    declineRequest,
    refetch: fetchRequests,
    count: requests.length,
  };
}
