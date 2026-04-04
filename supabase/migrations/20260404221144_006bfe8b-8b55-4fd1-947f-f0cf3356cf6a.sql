-- Add last_seen column to scribble_players for heartbeat tracking
ALTER TABLE public.scribble_players
ADD COLUMN IF NOT EXISTS last_seen timestamptz NOT NULL DEFAULT now();

-- Add unique constraint for upsert support
ALTER TABLE public.scribble_players
ADD CONSTRAINT scribble_players_lobby_user_unique UNIQUE (lobby_id, user_id);