-- Create user_invites table to store pending invitations
CREATE TABLE IF NOT EXISTS public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_invites
CREATE POLICY "Org admins can view invites in their org" ON public.user_invites
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = public.get_user_organization_id()
  );

CREATE POLICY "Super admins can manage all invites" ON public.user_invites
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org admins can insert invites in their org" ON public.user_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = public.get_user_organization_id()
  );

CREATE POLICY "Org admins can update invites in their org" ON public.user_invites
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = public.get_user_organization_id()
  );

CREATE POLICY "Org admins can delete invites in their org" ON public.user_invites
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) 
    AND organization_id = public.get_user_organization_id()
  );

-- Update ensure_admin_for_email function to accept role and handle invites
CREATE OR REPLACE FUNCTION public.ensure_admin_for_email(
  _email TEXT, 
  _org_slug TEXT,
  _role app_role DEFAULT 'admin'::app_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_result JSONB;
BEGIN
  -- Get organization ID
  SELECT id INTO v_org_id FROM public.organizations WHERE slug = _org_slug LIMIT 1;
  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization not found');
  END IF;

  -- Find user by email (case-insensitive)
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- User exists - update profile and assign role
    INSERT INTO public.profiles (id, email, full_name, organization_id, user_type)
    VALUES (v_user_id, lower(_email), _email, v_org_id, 'organization')
    ON CONFLICT (id)
    DO UPDATE SET 
      organization_id = EXCLUDED.organization_id,
      user_type = 'organization',
      updated_at = now();

    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (v_user_id, _role, v_org_id)
    ON CONFLICT (user_id, role)
    DO UPDATE SET organization_id = EXCLUDED.organization_id;
    
    v_result := jsonb_build_object('success', true, 'status', 'assigned', 'user_id', v_user_id::text);
  ELSE
    -- User doesn't exist - create invite
    INSERT INTO public.user_invites (email, organization_id, role, invited_by)
    VALUES (lower(_email), v_org_id, _role, auth.uid())
    ON CONFLICT (email, organization_id)
    DO UPDATE SET 
      role = EXCLUDED.role, 
      expires_at = now() + INTERVAL '7 days',
      accepted_at = NULL,
      invited_by = EXCLUDED.invited_by;
    
    v_result := jsonb_build_object('success', true, 'status', 'invited');
  END IF;

  RETURN v_result;
END;
$$;

-- Create trigger function to process pending invites when user signs up
CREATE OR REPLACE FUNCTION public.process_pending_invites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_invite RECORD;
BEGIN
  -- Find any pending invites for this email
  FOR v_invite IN 
    SELECT * FROM public.user_invites 
    WHERE lower(email) = lower(NEW.email)
    AND accepted_at IS NULL 
    AND expires_at > now()
  LOOP
    -- Update profile with organization
    UPDATE public.profiles 
    SET organization_id = v_invite.organization_id,
        user_type = 'organization',
        updated_at = now()
    WHERE id = NEW.id;
    
    -- Assign role
    INSERT INTO public.user_roles (user_id, role, organization_id)
    VALUES (NEW.id, v_invite.role, v_invite.organization_id)
    ON CONFLICT (user_id, role) DO UPDATE 
    SET organization_id = EXCLUDED.organization_id;
    
    -- Mark invite as accepted
    UPDATE public.user_invites 
    SET accepted_at = now() 
    WHERE id = v_invite.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created_process_invites ON public.profiles;
CREATE TRIGGER on_profile_created_process_invites
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_invites();