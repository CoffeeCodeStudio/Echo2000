
-- Create an immutable function to extract date from timestamptz in UTC
CREATE OR REPLACE FUNCTION public.utc_date(ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
AS $$ SELECT (ts AT TIME ZONE 'UTC')::date $$;

-- Add unique constraint: one visit per visitor per day
CREATE UNIQUE INDEX profile_visits_owner_visitor_day_key 
ON public.profile_visits (profile_owner_id, visitor_id, (public.utc_date(visited_at)));
