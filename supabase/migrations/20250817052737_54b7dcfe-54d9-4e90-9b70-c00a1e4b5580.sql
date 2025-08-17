-- Normalize existing phone numbers to +1XXXXXXXXXX format

-- Create a function to normalize phone numbers
CREATE OR REPLACE FUNCTION normalize_phone_number(phone_input TEXT)
RETURNS TEXT AS $$
DECLARE
    digits_only TEXT;
    digit_count INTEGER;
BEGIN
    -- Return NULL if input is NULL or empty
    IF phone_input IS NULL OR trim(phone_input) = '' THEN
        RETURN NULL;
    END IF;

    -- Remove all non-digit characters
    digits_only := regexp_replace(phone_input, '[^0-9]', '', 'g');
    
    -- Return NULL if no digits or less than 10 digits
    digit_count := length(digits_only);
    IF digit_count < 10 THEN
        RETURN NULL;
    END IF;

    -- Handle different digit counts
    IF digit_count = 10 THEN
        -- 10 digits - add +1 country code
        RETURN '+1' || digits_only;
    ELSIF digit_count = 11 AND left(digits_only, 1) = '1' THEN
        -- 11 digits starting with 1 - already has country code
        RETURN '+' || digits_only;
    ELSIF digit_count = 11 AND left(digits_only, 1) != '1' THEN
        -- 11 digits not starting with 1 - assume it's a 10-digit number with extra digit
        RETURN '+1' || right(digits_only, 10);
    ELSIF digit_count > 11 THEN
        -- More than 11 digits - take last 10 and add +1
        RETURN '+1' || right(digits_only, 10);
    END IF;

    -- Fallback
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update applications table - normalize phone numbers
UPDATE applications 
SET phone = normalize_phone_number(phone)
WHERE phone IS NOT NULL 
  AND phone != normalize_phone_number(phone);

-- Update applications table - normalize secondary phone numbers
UPDATE applications 
SET secondary_phone = normalize_phone_number(secondary_phone)
WHERE secondary_phone IS NOT NULL 
  AND secondary_phone != normalize_phone_number(secondary_phone);

-- Update applications table - normalize emergency contact phone numbers
UPDATE applications 
SET emergency_contact_phone = normalize_phone_number(emergency_contact_phone)
WHERE emergency_contact_phone IS NOT NULL 
  AND emergency_contact_phone != normalize_phone_number(emergency_contact_phone);

-- Update sms_conversations table - normalize phone numbers
UPDATE sms_conversations 
SET phone_number = normalize_phone_number(phone_number)
WHERE phone_number IS NOT NULL 
  AND phone_number != normalize_phone_number(phone_number);

-- Update sms_magic_links table - normalize phone numbers
UPDATE sms_magic_links 
SET phone_number = normalize_phone_number(phone_number)
WHERE phone_number IS NOT NULL 
  AND phone_number != normalize_phone_number(phone_number);

-- Update clients table - normalize phone numbers
UPDATE clients 
SET phone = normalize_phone_number(phone)
WHERE phone IS NOT NULL 
  AND phone != normalize_phone_number(phone);

-- Update recruiters table - normalize phone numbers
UPDATE recruiters 
SET phone = normalize_phone_number(phone)
WHERE phone IS NOT NULL 
  AND phone != normalize_phone_number(phone);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Phone number normalization completed. All phone numbers have been standardized to +1XXXXXXXXXX format.';
END $$;