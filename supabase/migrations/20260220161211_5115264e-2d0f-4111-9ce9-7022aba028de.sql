-- Update the notification trigger to use apply.jobs domain instead of ats.me
CREATE OR REPLACE FUNCTION public.trigger_outbound_webhook()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  webhook_url TEXT := NULL;
  job_user_id UUID;
BEGIN
  IF NEW.job_listing_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT user_id INTO job_user_id
  FROM job_listings 
  WHERE id = NEW.job_listing_id;
  
  IF job_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT wc.webhook_url INTO webhook_url
  FROM webhook_configurations wc
  WHERE wc.user_id = job_user_id 
    AND wc.enabled = true
    AND wc.webhook_url IS NOT NULL
    AND wc.webhook_url != ''
  LIMIT 1;
  
  IF webhook_url IS NOT NULL AND webhook_url != '' THEN
    PERFORM net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'event', 'application.created',
        'application_id', NEW.id,
        'job_listing_id', NEW.job_listing_id,
        'created_at', NEW.created_at
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;