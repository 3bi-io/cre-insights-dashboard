-- 1. Create organization_holidays table
CREATE TABLE public.organization_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  name text NOT NULL,
  recurring boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, holiday_date)
);

ALTER TABLE public.organization_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view holidays for their org"
  ON public.organization_holidays FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage org holidays"
  ON public.organization_holidays FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 2. Seed US federal holidays 2025 and 2026 (organization_id = NULL = global defaults)
INSERT INTO public.organization_holidays (organization_id, holiday_date, name, recurring) VALUES
  (NULL, '2025-01-01', 'New Year''s Day', false),
  (NULL, '2025-01-20', 'Martin Luther King Jr. Day', false),
  (NULL, '2025-02-17', 'Presidents'' Day', false),
  (NULL, '2025-05-26', 'Memorial Day', false),
  (NULL, '2025-06-19', 'Juneteenth', false),
  (NULL, '2025-07-04', 'Independence Day', false),
  (NULL, '2025-09-01', 'Labor Day', false),
  (NULL, '2025-10-13', 'Columbus Day', false),
  (NULL, '2025-11-11', 'Veterans Day', false),
  (NULL, '2025-11-27', 'Thanksgiving Day', false),
  (NULL, '2025-12-25', 'Christmas Day', false),
  (NULL, '2026-01-01', 'New Year''s Day', false),
  (NULL, '2026-01-19', 'Martin Luther King Jr. Day', false),
  (NULL, '2026-02-16', 'Presidents'' Day', false),
  (NULL, '2026-05-25', 'Memorial Day', false),
  (NULL, '2026-06-19', 'Juneteenth', false),
  (NULL, '2026-07-03', 'Independence Day (Observed)', false),
  (NULL, '2026-09-07', 'Labor Day', false),
  (NULL, '2026-10-12', 'Columbus Day', false),
  (NULL, '2026-11-11', 'Veterans Day', false),
  (NULL, '2026-11-26', 'Thanksgiving Day', false),
  (NULL, '2026-12-25', 'Christmas Day', false);

-- 3. is_holiday function
CREATE OR REPLACE FUNCTION public.is_holiday(p_org_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_holidays
    WHERE holiday_date = p_date
      AND (organization_id = p_org_id OR organization_id IS NULL)
  )
$$;

-- 4. Upsert holiday RPC
CREATE OR REPLACE FUNCTION public.upsert_organization_holiday(
  p_org_id uuid,
  p_date date,
  p_name text,
  p_recurring boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.organization_holidays (organization_id, holiday_date, name, recurring)
  VALUES (p_org_id, p_date, p_name, p_recurring)
  ON CONFLICT (organization_id, holiday_date)
  DO UPDATE SET name = EXCLUDED.name, recurring = EXCLUDED.recurring, updated_at = now()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- 5. Delete holiday RPC
CREATE OR REPLACE FUNCTION public.delete_organization_holiday(
  p_org_id uuid,
  p_holiday_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.organization_holidays
  WHERE id = p_holiday_id
    AND organization_id = p_org_id;
  RETURN FOUND;
END;
$$;