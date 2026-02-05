-- Create function to trigger Google Indexing API on job changes
CREATE OR REPLACE FUNCTION public.notify_google_indexing()
RETURNS TRIGGER AS $$
DECLARE
  action_type text;
  job_url text;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only trigger for status changes or significant updates
    IF OLD.status IS DISTINCT FROM NEW.status OR 
       OLD.title IS DISTINCT FROM NEW.title OR
       OLD.is_hidden IS DISTINCT FROM NEW.is_hidden THEN
      action_type := 'updated';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
  END IF;

  -- Build job URL
  job_url := 'https://ats.me/jobs/' || COALESCE(NEW.id, OLD.id);

  -- Only notify for active, non-hidden jobs (or deletions/deactivations)
  IF TG_OP = 'DELETE' OR 
     (NEW.status = 'inactive' AND OLD.status = 'active') OR
     (NEW.status = 'active' AND NOT COALESCE(NEW.is_hidden, false)) THEN
    
    -- Use pg_net to call the edge function asynchronously
    PERFORM net.http_post(
      url := 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/google-indexing-trigger',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1d2hjZHBwcGxkamxjYXh6c21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NDg1NjAsImV4cCI6MjA2NTMyNDU2MH0._K3Se_I9Y5dGmV-42V4MJvj4AqSWouXRTXVArOVASdU'
      ),
      body := jsonb_build_object(
        'job_id', COALESCE(NEW.id, OLD.id)::text,
        'action', action_type,
        'url', job_url,
        'organization_id', COALESCE(NEW.organization_id, OLD.organization_id)::text
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for job_listings table
DROP TRIGGER IF EXISTS trigger_google_indexing_on_job_change ON public.job_listings;

CREATE TRIGGER trigger_google_indexing_on_job_change
AFTER INSERT OR UPDATE OR DELETE ON public.job_listings
FOR EACH ROW
EXECUTE FUNCTION public.notify_google_indexing();

-- Add comment for documentation
COMMENT ON FUNCTION public.notify_google_indexing() IS 'Automatically notifies Google Indexing API when job listings are created, updated, or deleted';