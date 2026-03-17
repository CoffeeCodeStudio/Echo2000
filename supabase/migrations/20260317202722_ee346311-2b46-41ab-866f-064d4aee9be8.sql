ALTER TABLE public.lajv_messages DROP COLUMN expires_at;
ALTER TABLE public.lajv_messages ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '12 hours');