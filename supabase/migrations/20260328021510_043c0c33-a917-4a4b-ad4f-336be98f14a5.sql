-- Create trigger function for real-time Google indexing on job changes
CREATE OR REPLACE FUNCTION public.notify_google_indexing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_action TEXT;
  v_job_id UUID;
BEGIN
  -- Determine action
  IF TG_OP = 'DELETE' THEN
    v_job_id := OLD.id;
    v_action := 'deleted';
  ELSIF TG_OP = 'INSERT' THEN
    v_job_id := NEW.id;
    v_action := 'created';
    -- Only trigger for active, non-hidden jobs with title+location
    IF NEW.status != 'active' OR NEW.is_hidden = true OR NEW.title IS NULL OR NEW.location IS NULL OR NEW.location = '' THEN
      RETURN NEW;
    END IF;
  ELSE -- UPDATE
    v_job_id := NEW.id;
    v_action := 'updated';
    -- Only trigger if the job is/was active and relevant fields changed
    IF (NEW.status != 'active' AND OLD.status != 'active') THEN
      RETURN NEW;
    END IF;
    -- If job became inactive, send delete notification
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      v_action := 'deleted';
    END IF;
    -- Skip if nothing relevant changed
    IF NEW.status = OLD.status AND NEW.title IS NOT DISTINCT FROM OLD.title 
       AND NEW.location IS NOT DISTINCT FROM OLD.location 
       AND NEW.is_hidden = OLD.is_hidden THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Fire async HTTP call to google-indexing-trigger via pg_net
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/google-indexing-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key', true)
    ),
    body := jsonb_build_object(
      'job_id', v_job_id,
      'action', v_action,
      'organization_id', COALESCE(NEW.organization_id, OLD.organization_id)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create the trigger on job_listings
DROP TRIGGER IF EXISTS trg_google_indexing_notify ON public.job_listings;
CREATE TRIGGER trg_google_indexing_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.job_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_google_indexing();