-- MIGRATION 1: Add recruiter role to enum
-- Must be separate migration so the value is committed before use

-- Add 'recruiter' to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'recruiter' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recruiter' AFTER 'moderator';
  END IF;
END $$;