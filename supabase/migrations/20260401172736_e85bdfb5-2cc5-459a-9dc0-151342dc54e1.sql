
CREATE TABLE public.bot_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_user_id, target_user_id)
);

ALTER TABLE public.bot_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage bot_memories"
ON public.bot_memories
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_bot_memories_updated_at
BEFORE UPDATE ON public.bot_memories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
