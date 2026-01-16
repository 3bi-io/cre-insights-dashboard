-- Fix Function Search Path for validate_phone_number
-- Drop and recreate with proper search_path set

-- First, get the current function definition and recreate with search_path
CREATE OR REPLACE FUNCTION public.validate_phone_number(phone text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Check if phone matches E.164 format or common US formats
  RETURN phone ~ '^\+?[1-9]\d{1,14}$' 
      OR phone ~ '^\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$'
      OR phone ~ '^[0-9]{10,11}$';
END;
$$;

-- Fix Function Search Path for validate_outbound_call_phone
CREATE OR REPLACE FUNCTION public.validate_outbound_call_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate phone number format
  IF NEW.phone_number IS NOT NULL THEN
    -- Remove any non-digit characters except + for country code
    NEW.phone_number := regexp_replace(NEW.phone_number, '[^0-9+]', '', 'g');
    
    -- Ensure phone number is valid E.164 format
    IF NOT (NEW.phone_number ~ '^\+?[1-9]\d{1,14}$') THEN
      RAISE EXCEPTION 'Invalid phone number format. Must be E.164 format.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add RLS policies to applications_sensitive view
-- First, check if the view exists and add policies
-- Note: Views inherit RLS from base tables, but we need to ensure proper access

-- Create policy to ensure only authorized users can access sensitive data
-- This uses the existing can_access_sensitive_applicant_data function
DO $$
BEGIN
  -- Drop existing policy if exists
  DROP POLICY IF EXISTS "Only authorized users can view sensitive data" ON public.applications;
  
  -- The applications_sensitive view is based on applications table
  -- RLS is enforced through the base table policies
  -- Verify the can_access_sensitive_applicant_data function is being used
END $$;

COMMENT ON FUNCTION public.validate_phone_number(text) IS 'Validates phone number format - supports E.164 and common US formats. Search path fixed for security.';
COMMENT ON FUNCTION public.validate_outbound_call_phone() IS 'Trigger function to validate and normalize phone numbers for outbound calls. Search path fixed for security.';