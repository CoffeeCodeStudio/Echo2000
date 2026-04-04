
ALTER TABLE public.snake_highscores ADD COLUMN IF NOT EXISTS app text NOT NULL DEFAULT 'stajlplejs';
ALTER TABLE public.memory_highscores ADD COLUMN IF NOT EXISTS app text NOT NULL DEFAULT 'stajlplejs';
ALTER TABLE public.memory_sessions ADD COLUMN IF NOT EXISTS app text NOT NULL DEFAULT 'stajlplejs';
ALTER TABLE public.scribble_lobbies ADD COLUMN IF NOT EXISTS app text NOT NULL DEFAULT 'stajlplejs';

CREATE INDEX IF NOT EXISTS idx_snake_highscores_app ON public.snake_highscores(app);
CREATE INDEX IF NOT EXISTS idx_memory_highscores_app ON public.memory_highscores(app);
CREATE INDEX IF NOT EXISTS idx_scribble_lobbies_app ON public.scribble_lobbies(app);
