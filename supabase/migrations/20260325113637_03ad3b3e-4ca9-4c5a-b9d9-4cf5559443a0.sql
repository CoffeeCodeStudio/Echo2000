CREATE POLICY "Visitors can read their own visit records"
ON public.profile_visits FOR SELECT
TO authenticated
USING (auth.uid() = visitor_id);