-- Add enabled status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN enabled boolean NOT NULL DEFAULT true;

-- Create function to update user status (super admin only)
CREATE OR REPLACE FUNCTION public.update_user_status(_user_id uuid, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only super admins can update user status
  IF NOT is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can update user status';
  END IF;

  -- Prevent disabling other super admins
  IF NOT _enabled AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'super_admin'::app_role
  ) THEN
    RAISE EXCEPTION 'Cannot disable super administrator accounts';
  END IF;

  -- Update user status
  UPDATE public.profiles 
  SET enabled = _enabled, updated_at = now()
  WHERE id = _user_id;
END;
$$;