-- Helper: function to get org id by slug
CREATE OR REPLACE FUNCTION public.get_org_id_by_slug(_slug text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.organizations WHERE slug = _slug LIMIT 1
$$;

-- 1) Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  domain text,
  settings jsonb DEFAULT '{}',
  subscription_status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Seed default org (C.R. England) if not present
INSERT INTO public.organizations (name, slug, settings)
SELECT 'C.R. England', 'cr-england', '{"theme":"default","features":["meta_api","google_jobs","indeed_api"]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'cr-england');

-- 3) Add organization_id columns (nullable for now) with sensible DEFAULTs for app-writes
DO $$
BEGIN
  -- profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='profiles' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.profiles 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- user_roles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_roles' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.user_roles 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- job_listings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='job_listings' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.job_listings 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- campaigns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='campaigns' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.campaigns 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- platforms
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='platforms' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.platforms 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- clients
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='clients' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.clients 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- chat_sessions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='chat_sessions' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.chat_sessions 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- webhook_configurations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='webhook_configurations' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.webhook_configurations 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- ai_settings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='ai_settings' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.ai_settings 
      ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE 
      DEFAULT public.get_user_organization_id();
  END IF;

  -- meta tables (keep NULLABLE, no default; set via edge functions later)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meta_ad_accounts' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.meta_ad_accounts ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meta_campaigns' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.meta_campaigns ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meta_ad_sets' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.meta_ad_sets ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meta_ads' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.meta_ads ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='meta_daily_spend' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.meta_daily_spend ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  -- other tables
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenstreet_field_mappings' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.tenstreet_field_mappings ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT public.get_user_organization_id();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='background_tasks' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.background_tasks ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ai_metrics' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.ai_metrics ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='budget_allocations' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.budget_allocations ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT public.get_user_organization_id();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sms_conversations' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.sms_conversations ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='recruiters' AND column_name='organization_id'
  ) THEN
    ALTER TABLE public.recruiters ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 4) Backfill organization_id using users' profiles when possible; otherwise default to C.R. England org
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.profiles p
SET organization_id = (SELECT id FROM org)
WHERE p.organization_id IS NULL;

WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.user_roles ur
SET organization_id = COALESCE(ur.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = ur.user_id))
WHERE ur.organization_id IS NULL;

-- Tables with user_id -> derive org from profile
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.job_listings jl
SET organization_id = COALESCE(jl.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = jl.user_id), (SELECT id FROM org))
WHERE jl.organization_id IS NULL;

WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.campaigns c
SET organization_id = COALESCE(c.organization_id, (SELECT jl.organization_id FROM public.job_listings jl WHERE jl.user_id = c.user_id LIMIT 1), (SELECT id FROM org))
WHERE c.organization_id IS NULL;

-- Tables without user_id -> assign default org
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.clients SET organization_id = (SELECT id FROM org) WHERE organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.platforms SET organization_id = (SELECT id FROM org) WHERE organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.chat_sessions cs
SET organization_id = COALESCE(cs.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = cs.user_id), (SELECT id FROM org))
WHERE cs.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.webhook_configurations wc
SET organization_id = COALESCE(wc.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = wc.user_id), (SELECT id FROM org))
WHERE wc.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.ai_settings s
SET organization_id = COALESCE(s.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = s.user_id), (SELECT id FROM org))
WHERE s.organization_id IS NULL;

-- Meta tables -> derive from user_id when present else default org
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.meta_ad_accounts m SET organization_id = COALESCE(m.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = m.user_id), (SELECT id FROM org)) WHERE m.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.meta_campaigns m SET organization_id = COALESCE(m.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = m.user_id), (SELECT id FROM org)) WHERE m.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.meta_ad_sets m SET organization_id = COALESCE(m.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = m.user_id), (SELECT id FROM org)) WHERE m.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.meta_ads m SET organization_id = COALESCE(m.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = m.user_id), (SELECT id FROM org)) WHERE m.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.meta_daily_spend m SET organization_id = COALESCE(m.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = m.user_id), (SELECT id FROM org)) WHERE m.organization_id IS NULL;

-- Other tables
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.tenstreet_field_mappings t SET organization_id = COALESCE(t.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = t.user_id), (SELECT id FROM org)) WHERE t.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.background_tasks t SET organization_id = COALESCE(t.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = t.user_id), (SELECT id FROM org)) WHERE t.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.ai_metrics t SET organization_id = COALESCE(t.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = t.user_id), (SELECT id FROM org)) WHERE t.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.budget_allocations t SET organization_id = COALESCE(t.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = t.user_id), (SELECT id FROM org)) WHERE t.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.sms_conversations t SET organization_id = COALESCE(t.organization_id, (SELECT r.organization_id FROM public.recruiters r WHERE r.id = t.recruiter_id), (SELECT id FROM org)) WHERE t.organization_id IS NULL;
WITH org AS (
  SELECT public.get_org_id_by_slug('cr-england') AS id
)
UPDATE public.recruiters t SET organization_id = COALESCE(t.organization_id, (SELECT p.organization_id FROM public.profiles p WHERE p.id = t.user_id), (SELECT id FROM org)) WHERE t.organization_id IS NULL;

-- 5) Auth helper functions (org-aware)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.organization_id = (SELECT organization_id FROM public.profiles WHERE id = _user_id)
  )
$$;

-- 6) RLS: Organizations
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can manage their organization" ON public.organizations;
CREATE POLICY "Users can view their own organization" ON public.organizations
FOR SELECT USING (id = public.get_user_organization_id());
CREATE POLICY "Admins can manage their organization" ON public.organizations
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND id = public.get_user_organization_id());

-- 7) Profiles RLS (org-aware)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles in their org" ON public.profiles FOR SELECT USING (organization_id = public.get_user_organization_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles in org" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) AND organization_id = public.get_user_organization_id());

-- 8) Clients RLS
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;
CREATE POLICY "Users can manage clients in org" ON public.clients
FOR ALL USING (organization_id = public.get_user_organization_id())
WITH CHECK (organization_id = public.get_user_organization_id());

-- 9) Job listings RLS: keep public SELECT to avoid breaking public site; scope writes by org
DROP POLICY IF EXISTS "Users can create their own job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can update their own job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Users can delete their own job listings" ON public.job_listings;
CREATE POLICY "Users can create job listings in org" ON public.job_listings
FOR INSERT WITH CHECK (auth.uid() = user_id AND organization_id = public.get_user_organization_id());
CREATE POLICY "Users can update own job listings in org" ON public.job_listings
FOR UPDATE USING (auth.uid() = user_id AND organization_id = public.get_user_organization_id());
CREATE POLICY "Users can delete own job listings in org" ON public.job_listings
FOR DELETE USING (auth.uid() = user_id AND organization_id = public.get_user_organization_id());

-- 10) Update signup trigger to attach org (defaults to CR England for now)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT public.get_org_id_by_slug('cr-england') INTO v_org_id;
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    v_org_id
  );
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'user'::app_role, v_org_id)
  ON CONFLICT (user_id, role, organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET email = NEW.email,
      full_name = COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;