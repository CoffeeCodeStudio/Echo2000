
-- Memory sessions (anti-cheat)
CREATE TABLE IF NOT EXISTS public.memory_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  username text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  pairs integer NOT NULL DEFAULT 8,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  is_valid boolean NOT NULL DEFAULT true,
  score integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone insert session" ON public.memory_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone update session" ON public.memory_sessions FOR UPDATE USING (true);
CREATE POLICY "Service reads sessions" ON public.memory_sessions FOR SELECT USING (true);

-- Memory events
CREATE TABLE IF NOT EXISTS public.memory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.memory_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  card_a_id integer,
  card_b_id integer,
  event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone insert event" ON public.memory_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Service reads events" ON public.memory_events FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_memory_events_session ON public.memory_events(session_id);
CREATE INDEX IF NOT EXISTS idx_memory_sessions_token ON public.memory_sessions(session_token);
