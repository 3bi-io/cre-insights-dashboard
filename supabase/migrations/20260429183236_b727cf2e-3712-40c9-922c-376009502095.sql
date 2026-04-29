CREATE OR REPLACE FUNCTION public.notify_google_indexing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_action TEXT;
  v_job_id UUID;
  v_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- Determine action
  IF TG_OP = 'DELETE' THEN
    v_job_id := OLD.id;
    v_action := 'deleted';
  ELSIF TG_OP = 'INSERT' THEN
    v_job_id := NEW.id;
    v_action := 'created';
    IF NEW.status != 'active' OR NEW.is_hidden = true OR NEW.title IS NULL OR NEW.location IS NULL OR NEW.location = '' THEN
      RETURN NEW;
    END IF;
  ELSE
    v_job_id := NEW.id;
    v_action := 'updated';
    IF (NEW.status != 'active' AND OLD.status != 'active') THEN
      RETURN NEW;
    END IF;
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      v_action := 'deleted';
    END IF;
    IF NEW.status = OLD.status AND NEW.title IS NOT DISTINCT FROM OLD.title
       AND NEW.location IS NOT DISTINCT FROM OLD.location
       AND NEW.is_hidden = OLD.is_hidden THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Read settings safely
  BEGIN
    v_url := current_setting('app.settings.supabase_url', true);
    v_anon_key := current_setting('app.settings.supabase_anon_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_url := NULL;
    v_anon_key := NULL;
  END;

  -- Fail-safe: skip notification if webhook URL is not configured.
  -- Prevents NOT NULL constraint errors in net.http_request_queue from
  -- blocking legitimate job inserts/updates.
  IF v_url IS NULL OR v_url = '' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  PERFORM net.http_post(
    url := v_url || '/functions/v1/google-indexing-trigger',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_anon_key, '')
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