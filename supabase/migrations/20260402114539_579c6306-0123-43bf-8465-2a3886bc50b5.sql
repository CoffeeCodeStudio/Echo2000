-- Remove the vulnerable UPDATE policy that lets users modify their own allowance
DROP POLICY IF EXISTS "Users can update their own allowance" ON public.good_vibe_allowances;

-- Remove the vulnerable INSERT policy that lets users create their own allowance
DROP POLICY IF EXISTS "Users can insert their own allowance" ON public.good_vibe_allowances;

-- Only admins can insert/update allowances
CREATE POLICY "Admins can manage allowances"
ON public.good_vibe_allowances
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));