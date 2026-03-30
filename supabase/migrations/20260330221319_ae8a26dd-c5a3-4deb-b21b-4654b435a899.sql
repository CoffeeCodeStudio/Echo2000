
-- Drop the trigger and function we created for is_admin (no longer needed)
DROP TRIGGER IF EXISTS prevent_admin_self_promotion ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_self_admin_promotion();

-- Remove the is_admin column entirely
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;
