-- Drop the restrictive SELECT policy
DROP POLICY "Users can read own friend votes" ON public.friend_votes;

-- Create a new policy that allows all authenticated users to read all votes
CREATE POLICY "Authenticated users can read friend votes"
ON public.friend_votes
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);