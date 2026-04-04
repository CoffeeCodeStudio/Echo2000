import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const VOTE_CATEGORIES = [
  'Bäst', 'Nörd', 'Cooling', 'Hård som sten', 'Festis', 'Ball', 'Tuffing',
] as const;

export type VoteCategory = (typeof VOTE_CATEGORIES)[number];

export interface VoteCounts {
  [category: string]: number;
}

export interface UserVotes {
  [category: string]: boolean;
}

const createEmptyVoteCounts = (): VoteCounts =>
  Object.fromEntries(VOTE_CATEGORIES.map((category) => [category, 0])) as VoteCounts;

/**
 * Manages "friend vote" categories (e.g. Bäst, Nörd, Cooling) for a target user.
 *
 * Fetches aggregated vote counts and the current user's own votes, and
 * provides a `toggleVote` action that optimistically updates the UI with
 * automatic re-sync on error.
 *
 * @param targetUserId - The user whose votes to load.
 * @returns Vote counts, user votes, total, toggle callback, and loading state.
 */
export function useFriendVotes(targetUserId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voteCounts, setVoteCounts] = useState<VoteCounts>(() => createEmptyVoteCounts());
  const [userVotes, setUserVotes] = useState<UserVotes>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchRequestRef = useRef(0);

  useEffect(() => {
    setVoteCounts(createEmptyVoteCounts());
    setUserVotes({});
    setTotalVotes(0);
  }, [targetUserId]);

  const fetchVotes = useCallback(async () => {
    const requestId = ++fetchRequestRef.current;

    if (!targetUserId) return;

    try {
      const { data: allVotes, error } = await supabase
        .from('friend_votes')
        .select('vote_category, voter_id')
        .eq('target_user_id', targetUserId);

      if (requestId !== fetchRequestRef.current) return;
      if (error) throw error;

      const counts = createEmptyVoteCounts();
      const myVotes: UserVotes = {};
      let total = 0;

      allVotes?.forEach((vote) => {
        counts[vote.vote_category] = (counts[vote.vote_category] || 0) + 1;
        total++;
        if (user && vote.voter_id === user.id) {
          myVotes[vote.vote_category] = true;
        }
      });

      setVoteCounts(counts);
      setUserVotes(myVotes);
      setTotalVotes(total);
    } catch (err) {
      if (requestId !== fetchRequestRef.current) return;
      console.error('Error fetching friend votes:', err);
    }
  }, [targetUserId, user]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const toggleVote = async (category: VoteCategory) => {
    if (!user || !targetUserId || targetUserId === user.id) return;

    try {
      const { data: friendshipRows, error: friendshipError } = await supabase
        .from('friends')
        .select('id')
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${user.id})`
        )
        .eq('status', 'accepted')
        .limit(1);

      if (friendshipError) throw friendshipError;

      if (!friendshipRows?.length) {
        toast({
          title: 'Kan inte rösta',
          description: 'Endast vänner kan rösta på personlighet.',
          variant: 'destructive',
        });
        return;
      }
    } catch (err) {
      console.error('Error checking friendship before vote:', err);
      toast({
        title: 'Kunde inte rösta',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (userVotes[category]) {
        const { error } = await supabase
          .from('friend_votes')
          .delete()
          .eq('voter_id', user.id)
          .eq('target_user_id', targetUserId)
          .eq('vote_category', category);

        if (error) throw error;

        setUserVotes((prev) => ({ ...prev, [category]: false }));
        setVoteCounts((prev) => ({ ...prev, [category]: Math.max(0, (prev[category] || 0) - 1) }));
        setTotalVotes((prev) => Math.max(0, prev - 1));
      } else {
        const previousCategory = VOTE_CATEGORIES.find((cat) => userVotes[cat]);

        if (previousCategory) {
          const { error: delError } = await supabase
            .from('friend_votes')
            .delete()
            .eq('voter_id', user.id)
            .eq('target_user_id', targetUserId)
            .eq('vote_category', previousCategory);

          if (delError) throw delError;
        }

        const { error } = await supabase
          .from('friend_votes')
          .insert({
            voter_id: user.id,
            target_user_id: targetUserId,
            vote_category: category,
          });

        if (error) throw error;

        const newUserVotes: UserVotes = {};
        VOTE_CATEGORIES.forEach((cat) => {
          newUserVotes[cat] = cat === category;
        });
        setUserVotes(newUserVotes);

        setVoteCounts((prev) => {
          const updated = { ...prev, [category]: (prev[category] || 0) + 1 };
          if (previousCategory) {
            updated[previousCategory] = Math.max(0, (updated[previousCategory] || 0) - 1);
          }
          return updated;
        });

        if (!previousCategory) {
          setTotalVotes((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error toggling vote:', err);
      toast({
        title: 'Kunde inte rösta',
        description: 'Försök igen senare.',
        variant: 'destructive',
      });
      fetchVotes();
    } finally {
      setLoading(false);
    }
  };

  return { voteCounts, userVotes, totalVotes, toggleVote, loading, refetch: fetchVotes };
}
