-- Add client_id column to recruiter_calendar_connections
ALTER TABLE public.recruiter_calendar_connections 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Drop old unique constraint (one connection per user+provider)
ALTER TABLE public.recruiter_calendar_connections 
  DROP CONSTRAINT IF EXISTS recruiter_calendar_connections_user_id_provider_key;

-- New unique: one connection per user+provider+client (using COALESCE for NULL client_id)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_provider_client 
  ON public.recruiter_calendar_connections(user_id, provider, COALESCE(client_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index for client-level lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_client 
  ON public.recruiter_calendar_connections(client_id);

-- RLS policy: org admins can view all connections in their org
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recruiter_calendar_connections' 
    AND policyname = 'Admins can view org calendar connections'
  ) THEN
    CREATE POLICY "Admins can view org calendar connections"
      ON public.recruiter_calendar_connections FOR SELECT
      TO authenticated
      USING (
        organization_id = public.get_user_organization_id()
      );
  END IF;
END $$;

-- Allow admins to delete any connection in their org (for client calendar management)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recruiter_calendar_connections' 
    AND policyname = 'Admins can delete org calendar connections'
  ) THEN
    CREATE POLICY "Admins can delete org calendar connections"
      ON public.recruiter_calendar_connections FOR DELETE
      TO authenticated
      USING (
        organization_id = public.get_user_organization_id()
      );
  END IF;
END $$;