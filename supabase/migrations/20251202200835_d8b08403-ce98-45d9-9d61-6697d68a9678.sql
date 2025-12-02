-- Add user_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'organization' 
CHECK (user_type IN ('organization', 'jobseeker'));

-- Create candidate_profiles table for jobseeker-specific data
CREATE TABLE IF NOT EXISTS public.candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  resume_url TEXT,
  headline TEXT,
  summary TEXT,
  desired_job_title TEXT,
  desired_salary_min INTEGER,
  desired_salary_max INTEGER,
  years_experience INTEGER,
  cdl_class TEXT,
  cdl_endorsements TEXT[],
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public', 'recruiters_only')),
  open_to_opportunities BOOLEAN DEFAULT true,
  profile_completion_percentage INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on candidate_profiles
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidate_profiles
CREATE POLICY "Users can view own candidate profile" ON public.candidate_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own candidate profile" ON public.candidate_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own candidate profile" ON public.candidate_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can view all candidate profiles" ON public.candidate_profiles
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Recruiters can view public candidate profiles" ON public.candidate_profiles
  FOR SELECT USING (profile_visibility IN ('public', 'recruiters_only') AND auth.uid() IS NOT NULL);

-- Create updated_at trigger for candidate_profiles
CREATE OR REPLACE FUNCTION public.update_candidate_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_candidate_profiles_updated_at
  BEFORE UPDATE ON public.candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_candidate_profiles_updated_at();

-- Update handle_new_user function to support user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _user_type TEXT;
  _org_id UUID;
  _full_name TEXT;
BEGIN
  -- Get user_type from metadata, default to 'organization'
  _user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'organization');
  
  -- Get full_name from metadata if provided
  _full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- For organization users, try to get a default org; for jobseekers, no org
  IF _user_type = 'organization' THEN
    -- Get the cr-england org or null
    SELECT id INTO _org_id FROM public.organizations WHERE slug = 'cr-england' LIMIT 1;
  ELSE
    _org_id := NULL;
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, organization_id, user_type)
  VALUES (NEW.id, NEW.email, _full_name, _org_id, _user_type);
  
  -- For jobseekers, create a candidate_profiles entry
  IF _user_type = 'jobseeker' THEN
    INSERT INTO public.candidate_profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
  END IF;
  
  -- Assign default role based on user type
  IF _user_type = 'organization' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;