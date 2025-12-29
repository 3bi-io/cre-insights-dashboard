-- Update handle_new_user() to NOT default user_type for OAuth users
-- This allows the app to detect new OAuth users and prompt them to choose their type

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_type TEXT;
  _org_id UUID;
  _full_name TEXT;
BEGIN
  -- Get user_type from metadata - NULL if not provided (OAuth users)
  _user_type := NEW.raw_user_meta_data->>'user_type';
  
  -- Get full_name from metadata if provided
  _full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- For organization users, try to get a default org; for jobseekers or NULL, no org
  IF _user_type = 'organization' THEN
    SELECT id INTO _org_id FROM public.organizations WHERE slug = 'cr-england' LIMIT 1;
  ELSE
    _org_id := NULL;
  END IF;
  
  -- Insert profile (user_type can be NULL for OAuth users who need to choose)
  INSERT INTO public.profiles (id, email, full_name, organization_id, user_type)
  VALUES (NEW.id, NEW.email, _full_name, _org_id, _user_type);
  
  -- For jobseekers, create a candidate_profiles entry
  IF _user_type = 'jobseeker' THEN
    INSERT INTO public.candidate_profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
  END IF;
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;