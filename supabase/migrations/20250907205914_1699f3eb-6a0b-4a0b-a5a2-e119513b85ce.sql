-- Create organizations table for multi-tenancy
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  domain text,
  settings jsonb DEFAULT '{}',
  subscription_status text DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to profiles table
ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add organization_id to user_roles table
ALTER TABLE public.user_roles ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Update user_roles unique constraint to include organization
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_organization_key UNIQUE (user_id, role, organization_id);

-- Add organization_id to other key tables
ALTER TABLE public.job_listings ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.campaigns ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.platforms ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.chat_sessions ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.webhook_configurations ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_settings ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.meta_ad_accounts ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.meta_campaigns ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.meta_ad_sets ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.meta_ads ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.meta_daily_spend ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.tenstreet_field_mappings ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.background_tasks ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.ai_metrics ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.budget_allocations ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.sms_conversations ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.recruiters ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Insert default organization (C.R. England)
INSERT INTO public.organizations (id, name, slug, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'C.R. England',
  'cr-england',
  '{"theme": "default", "features": ["meta_api", "google_jobs", "indeed_api"]}'
);

-- Update existing data to use the default organization
UPDATE public.profiles SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.user_roles SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.job_listings SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.campaigns SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.platforms SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.clients SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.chat_sessions SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.webhook_configurations SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.ai_settings SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.meta_ad_accounts SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.meta_campaigns SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.meta_ad_sets SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.meta_ads SET organization_id = '00000000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.meta_daily_spend SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.tenstreet_field_mappings SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.background_tasks SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.ai_metrics SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.budget_allocations SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.sms_conversations SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;
UPDATE public.recruiters SET organization_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after data migration
ALTER TABLE public.profiles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.job_listings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.campaigns ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.chat_sessions ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.webhook_configurations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.ai_settings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.meta_ad_accounts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.meta_campaigns ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.meta_ad_sets ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.meta_ads ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.meta_daily_spend ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.tenstreet_field_mappings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.background_tasks ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.ai_metrics ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.budget_allocations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.sms_conversations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.recruiters ALTER COLUMN organization_id SET NOT NULL;

-- Update handle_new_user function to assign organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into profiles table with default organization
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
  
  -- Give new users the 'user' role by default in the default organization
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'user'::app_role, '00000000-0000-0000-0000-000000000001'::uuid)
  ON CONFLICT (user_id, role, organization_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- Update handle_user_update function
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET 
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$function$;

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
$function$;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_organization(_organization_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND organization_id = _organization_id
  )
$function$;

-- Update has_role function to be organization-aware
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
$function$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization" ON public.organizations
FOR SELECT USING (id = public.get_user_organization_id());

CREATE POLICY "Admins can manage their organization" ON public.organizations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND id = public.get_user_organization_id());

-- Update existing RLS policies to be organization-aware
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization" ON public.profiles
FOR SELECT USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles in their organization" ON public.profiles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id());

-- Update job_listings policies
DROP POLICY IF EXISTS "Everyone can view job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can create their own job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can update their own job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can delete their own job listings" ON public.job_listings;

CREATE POLICY "Users can view job listings in their organization" ON public.job_listings
FOR SELECT USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Users can create job listings in their organization" ON public.job_listings
FOR INSERT WITH CHECK (auth.uid() = user_id AND organization_id = public.get_user_organization_id());

CREATE POLICY "Users can update their own job listings" ON public.job_listings
FOR UPDATE USING (auth.uid() = user_id AND organization_id = public.get_user_organization_id());

CREATE POLICY "Users can delete their own job listings" ON public.job_listings
FOR DELETE USING (auth.uid() = user_id AND organization_id = public.get_user_organization_id());

-- Update clients policies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "Users can manage clients in their organization" ON public.clients
FOR ALL USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- Update trigger to ensure updated_at is maintained
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();