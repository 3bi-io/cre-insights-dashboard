-- Create table to store webhook configurations
CREATE TABLE IF NOT EXISTS public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  webhook_url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhook configurations
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook configurations
CREATE POLICY "Users can manage their own webhook configs" 
ON public.webhook_configurations 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to trigger outbound webhook
CREATE OR REPLACE FUNCTION public.trigger_outbound_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  webhook_url TEXT;
  job_user_id UUID;
BEGIN
  -- Get the user_id from the job listing
  SELECT user_id INTO job_user_id
  FROM job_listings 
  WHERE id = NEW.job_listing_id;
  
  -- Get the webhook URL for this user
  SELECT wc.webhook_url INTO webhook_url
  FROM webhook_configurations wc
  WHERE wc.user_id = job_user_id 
    AND wc.enabled = true
  LIMIT 1;
  
  -- If webhook URL exists, call the outbound webhook function
  IF webhook_url IS NOT NULL THEN
    PERFORM net.http_post(
      'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/outbound-webhook',
      json_build_object(
        'application_id', NEW.id,
        'webhook_url', webhook_url,
        'event_type', 'created'
      )::text,
      json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on applications table
CREATE TRIGGER trigger_new_application_webhook
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_outbound_webhook();