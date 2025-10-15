-- Create rate_limits table to track API requests
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- Can be user_id, IP, org_id, etc.
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index for efficient lookups
CREATE INDEX idx_rate_limits_identifier_endpoint ON public.rate_limits(identifier, endpoint, window_start);
CREATE INDEX idx_rate_limits_window_start ON public.rate_limits(window_start);

-- Super admins can view all rate limit data
CREATE POLICY "super_admins_view_rate_limits"
ON public.rate_limits
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- System can manage rate limits (for edge functions)
CREATE POLICY "system_manage_rate_limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _endpoint text,
  _max_requests integer DEFAULT 100,
  _window_minutes integer DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_window timestamp with time zone;
  current_count integer;
  result jsonb;
BEGIN
  -- Calculate current window start (rounded down to window_minutes)
  current_window := date_trunc('hour', now()) + 
    (floor(extract(minute from now()) / _window_minutes) * _window_minutes || ' minutes')::interval;

  -- Get or create rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, window_start, request_count)
  VALUES (_identifier, _endpoint, current_window, 1)
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO current_count;

  -- Check if limit exceeded
  IF current_count > _max_requests THEN
    result := jsonb_build_object(
      'allowed', false,
      'current_count', current_count,
      'limit', _max_requests,
      'window_minutes', _window_minutes,
      'retry_after', extract(epoch from (current_window + (_window_minutes || ' minutes')::interval - now()))::integer
    );
  ELSE
    result := jsonb_build_object(
      'allowed', true,
      'current_count', current_count,
      'limit', _max_requests,
      'window_minutes', _window_minutes,
      'remaining', _max_requests - current_count
    );
  END IF;

  RETURN result;
END;
$$;

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete records older than 24 hours
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Create rate limit configurations table
CREATE TABLE public.rate_limit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  max_requests integer NOT NULL DEFAULT 100,
  window_minutes integer NOT NULL DEFAULT 60,
  organization_id uuid REFERENCES public.organizations(id),
  user_role text, -- 'super_admin', 'admin', 'user', or NULL for global
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on config
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;

-- Super admins can manage rate limit configs
CREATE POLICY "super_admins_manage_rate_limit_config"
ON public.rate_limit_config
FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Everyone can read rate limit configs
CREATE POLICY "authenticated_read_rate_limit_config"
ON public.rate_limit_config
FOR SELECT
TO authenticated
USING (true);

-- Insert default rate limit configurations
INSERT INTO public.rate_limit_config (endpoint, max_requests, window_minutes, user_role) VALUES
  ('submit-application', 10, 60, NULL), -- 10 requests per hour for applications
  ('import-jobs-from-feed', 5, 60, 'admin'), -- 5 imports per hour for admins
  ('outbound-webhook', 100, 60, NULL), -- 100 webhooks per hour
  ('indeed-integration', 50, 60, NULL), -- 50 Indeed API calls per hour
  ('meta-adset-report', 20, 60, NULL); -- 20 Meta reports per hour