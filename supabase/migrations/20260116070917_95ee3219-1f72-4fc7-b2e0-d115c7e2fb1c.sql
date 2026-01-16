-- Add phone number validation function
CREATE OR REPLACE FUNCTION public.validate_phone_number(phone text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Allow NULL (some records may not have a phone yet)
  IF phone IS NULL THEN
    RETURN true;
  END IF;
  
  -- Check for invalid patterns (object serialization, empty, too short)
  IF phone LIKE '%object%' OR 
     phone LIKE '%Object%' OR
     phone LIKE '%[%' OR
     phone LIKE '%{%' OR
     LENGTH(phone) < 10 OR
     phone = '' THEN
    RETURN false;
  END IF;
  
  -- Valid phone number should only contain digits, +, -, (, ), and spaces
  IF NOT phone ~ '^[\d\s\+\-\(\)\.]+$' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Add trigger to validate phone numbers before insert/update
CREATE OR REPLACE FUNCTION public.validate_outbound_call_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.validate_phone_number(NEW.phone_number) THEN
    RAISE EXCEPTION 'Invalid phone number format: %', COALESCE(NEW.phone_number, 'NULL');
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_outbound_call_phone_trigger ON public.outbound_calls;

-- Create trigger
CREATE TRIGGER validate_outbound_call_phone_trigger
  BEFORE INSERT OR UPDATE OF phone_number ON public.outbound_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_outbound_call_phone();

-- Add comment for documentation
COMMENT ON FUNCTION public.validate_phone_number(text) IS 'Validates phone number format, preventing object serialization corruption and invalid formats';