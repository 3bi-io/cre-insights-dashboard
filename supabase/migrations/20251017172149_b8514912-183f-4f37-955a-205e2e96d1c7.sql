-- Fix search_path for the tenstreet credentials trigger function
CREATE OR REPLACE FUNCTION public.handle_tenstreet_credentials_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;