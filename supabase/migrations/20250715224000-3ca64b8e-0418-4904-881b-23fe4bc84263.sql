-- First, we need to check if the user exists and create admin role
-- This will work whether the user exists or not

DO $$
DECLARE
    user_uuid uuid;
BEGIN
    -- Try to find the user by email in the profiles table first
    SELECT id INTO user_uuid FROM public.profiles WHERE email = 'c@3bi.io';
    
    -- If user doesn't exist in profiles, we'll need to handle this differently
    -- For now, let's just insert the admin role if we have a user
    IF user_uuid IS NOT NULL THEN
        -- Remove any existing roles for this user
        DELETE FROM public.user_roles WHERE user_id = user_uuid;
        
        -- Add admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_uuid, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Successfully added admin role for user: %', user_uuid;
    ELSE
        RAISE NOTICE 'User with email c@3bi.io not found in profiles table. User must sign up first.';
    END IF;
END $$;