
CREATE OR REPLACE FUNCTION public.utc_date(ts timestamp with time zone)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
 SET search_path = public
AS $function$ SELECT (ts AT TIME ZONE 'UTC')::date $function$;
