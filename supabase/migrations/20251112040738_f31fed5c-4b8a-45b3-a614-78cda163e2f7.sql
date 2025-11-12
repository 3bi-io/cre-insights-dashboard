-- Phase 4: Security Hardening - Move Extensions Out of Public Schema
-- This migration creates an 'extensions' schema and moves all extensions from 'public' to prevent conflicts

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_stat_statements extension if it exists in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_stat_statements' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pg_stat_statements SET SCHEMA extensions;
  END IF;
END $$;

-- Move pgcrypto extension if it exists in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pgcrypto' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
END $$;

-- Move uuid-ossp extension if it exists in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'uuid-ossp' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION "uuid-ossp" SET SCHEMA extensions;
  END IF;
END $$;

-- Move http extension if it exists in public (used for webhooks)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'http' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION http SET SCHEMA extensions;
  END IF;
END $$;

-- Move pgjwt extension if it exists in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pgjwt' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pgjwt SET SCHEMA extensions;
  END IF;
END $$;

-- Note: Some extensions may require updating function references
-- If you have custom functions using these extensions, you may need to update their search_path