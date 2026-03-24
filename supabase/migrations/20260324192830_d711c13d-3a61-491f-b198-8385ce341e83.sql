
-- Add how_met column to friends table
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS how_met text DEFAULT NULL;

-- Create trigger function for BotAdam guestbook on friend acceptance
CREATE OR REPLACE FUNCTION public.botadam_friendship_guestbook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_botadam_id uuid;
  v_user1_name text;
  v_user2_name text;
  v_botadam_avatar text;
  v_how_met text;
  v_message text;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    -- Look up BotAdam dynamically
    SELECT user_id, avatar_url INTO v_botadam_id, v_botadam_avatar
    FROM public.profiles
    WHERE username = 'BotAdam'
    LIMIT 1;

    IF v_botadam_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get usernames
    SELECT username INTO v_user1_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
    SELECT username INTO v_user2_name FROM public.profiles WHERE user_id = NEW.friend_id LIMIT 1;

    v_how_met := COALESCE(NEW.how_met, 'Online');

    v_message := v_user1_name || ' och ' || v_user2_name || ' är nu vänner på Echo2000! De träffades: ' || v_how_met || ' 🎉 /BotAdam';

    -- Write in user1's guestbook
    INSERT INTO public.profile_guestbook (profile_owner_id, author_id, author_name, author_avatar, message)
    VALUES (NEW.user_id, v_botadam_id, 'BotAdam', v_botadam_avatar, v_message);

    -- Write in user2's guestbook
    INSERT INTO public.profile_guestbook (profile_owner_id, author_id, author_name, author_avatar, message)
    VALUES (NEW.friend_id, v_botadam_id, 'BotAdam', v_botadam_avatar, v_message);
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_friendship_accepted ON public.friends;
CREATE TRIGGER on_friendship_accepted
  AFTER UPDATE ON public.friends
  FOR EACH ROW
  EXECUTE FUNCTION public.botadam_friendship_guestbook();
