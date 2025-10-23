-- Grant super_admin role to C@3bi.io
-- This will give them access to all applications and resources across all organizations

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID for C@3bi.io
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'C@3bi.io';

  -- Check if user exists
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User C@3bi.io not found. Please ensure the user is registered first.';
  ELSE
    -- Remove any existing roles for this user to avoid duplicates
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id;

    -- Add super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin');

    RAISE NOTICE 'Successfully granted super_admin role to C@3bi.io (user_id: %)', v_user_id;
  END IF;
END $$;