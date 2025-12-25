-- Function to increment click count for short links
CREATE OR REPLACE FUNCTION public.increment_short_link_click(p_short_code VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE public.job_short_links 
  SET click_count = click_count + 1
  WHERE short_code = p_short_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;