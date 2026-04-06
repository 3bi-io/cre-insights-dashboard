CREATE OR REPLACE FUNCTION public.enforce_doublenickel_garrison_only()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_slug TEXT;
BEGIN
  SELECT slug INTO v_slug FROM ats_systems WHERE id = NEW.ats_system_id;
  IF v_slug = 'doublenickel' AND (NEW.client_id IS NULL OR NEW.client_id != 'be8b645e-d480-4c22-8e75-b09a7fc1db7a') THEN
    RAISE EXCEPTION 'Double Nickel connections are restricted to R.E. Garrison client only';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_enforce_doublenickel_garrison
  BEFORE INSERT OR UPDATE ON ats_connections
  FOR EACH ROW EXECUTE FUNCTION enforce_doublenickel_garrison_only();