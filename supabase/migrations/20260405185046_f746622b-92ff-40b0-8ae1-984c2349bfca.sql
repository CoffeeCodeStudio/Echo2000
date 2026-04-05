
-- memory_events: restrict INSERT to authenticated
DROP POLICY IF EXISTS "Anyone insert event" ON public.memory_events;
CREATE POLICY "Authenticated users can insert events"
  ON public.memory_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- memory_events: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Service reads events" ON public.memory_events;
CREATE POLICY "Authenticated users can read events"
  ON public.memory_events
  FOR SELECT
  TO authenticated
  USING (true);

-- memory_sessions: restrict INSERT to authenticated
DROP POLICY IF EXISTS "Anyone insert session" ON public.memory_sessions;
CREATE POLICY "Authenticated users can insert sessions"
  ON public.memory_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- memory_sessions: restrict UPDATE to authenticated
DROP POLICY IF EXISTS "Anyone update session" ON public.memory_sessions;
CREATE POLICY "Authenticated users can update sessions"
  ON public.memory_sessions
  FOR UPDATE
  TO authenticated
  USING (true);
