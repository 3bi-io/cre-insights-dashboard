
-- Reassign all triggers to use the single update_updated_at_column function
-- First, find and reassign triggers that use the duplicate functions

-- Drop the duplicate functions (CASCADE will reassign triggers)
-- We need to first update the triggers, then drop the functions

-- Get all triggers using these duplicate functions and reassign them
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Find all triggers using duplicate functions and recreate them with update_updated_at_column
  FOR r IN 
    SELECT tgname, relname, nspname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE p.proname IN (
      'handle_updated_at',
      'update_candidate_profiles_updated_at',
      'handle_tenstreet_credentials_updated_at',
      'update_client_webhook_updated_at',
      'update_elevenlabs_conversations_updated_at',
      'update_ai_performance_metrics_updated_at',
      'update_ai_decision_tracking_updated_at'
    )
    AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I.%I',
      r.tgname, r.nspname, r.relname
    );
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      r.tgname, r.nspname, r.relname
    );
  END LOOP;
END;
$$;

-- Now drop the duplicate functions
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_candidate_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_tenstreet_credentials_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_client_webhook_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_elevenlabs_conversations_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_ai_performance_metrics_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_ai_decision_tracking_updated_at() CASCADE;
