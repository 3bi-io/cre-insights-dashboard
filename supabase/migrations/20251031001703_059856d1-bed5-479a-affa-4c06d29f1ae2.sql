-- Fix remaining database functions without search_path for security
-- This addresses Supabase linter warnings about SECURITY DEFINER vulnerabilities

-- Fix classify_traffic_source function
CREATE OR REPLACE FUNCTION public.classify_traffic_source(referrer text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF referrer IS NULL OR referrer = '' THEN
    RETURN 'direct';
  ELSIF referrer ILIKE '%google%' THEN
    RETURN 'google';
  ELSIF referrer ILIKE '%facebook%' OR referrer ILIKE '%fb%' THEN
    RETURN 'facebook';
  ELSIF referrer ILIKE '%linkedin%' THEN
    RETURN 'linkedin';
  ELSIF referrer ILIKE '%indeed%' THEN
    RETURN 'indeed';
  ELSIF referrer ILIKE '%craigslist%' THEN
    RETURN 'craigslist';
  ELSE
    RETURN 'other';
  END IF;
END;
$function$;

-- Fix normalize_phone_number function
CREATE OR REPLACE FUNCTION public.normalize_phone_number(phone_input text)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  normalized text;
BEGIN
  -- Remove all non-digit characters
  normalized := regexp_replace(phone_input, '[^0-9]', '', 'g');
  
  -- If it starts with 1 and is 11 digits, remove the leading 1
  IF length(normalized) = 11 AND substring(normalized, 1, 1) = '1' THEN
    normalized := substring(normalized, 2);
  END IF;
  
  -- Return only if it's a valid 10-digit US phone number
  IF length(normalized) = 10 THEN
    RETURN normalized;
  ELSE
    RETURN NULL;
  END IF;
END;
$function$;

-- Fix update_platform_analytics_updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_platform_analytics_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Move pg_net extension to extensions schema (best practice)
-- Note: This requires superuser privileges and may need to be done manually
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
--     ALTER EXTENSION pg_net SET SCHEMA extensions;
--   END IF;
-- END $$;

-- Add comment for manual steps
COMMENT ON FUNCTION public.classify_traffic_source IS 'Fixed: Added search_path = public for security';
COMMENT ON FUNCTION public.normalize_phone_number IS 'Fixed: Added search_path = public for security';
COMMENT ON FUNCTION public.update_platform_analytics_updated_at IS 'Fixed: Added search_path = public for security';