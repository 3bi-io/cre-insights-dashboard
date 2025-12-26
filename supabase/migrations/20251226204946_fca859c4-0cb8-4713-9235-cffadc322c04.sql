-- Fix the function search_path for security
CREATE OR REPLACE FUNCTION update_bgc_updated_at()
RETURNS TRIGGER 
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;