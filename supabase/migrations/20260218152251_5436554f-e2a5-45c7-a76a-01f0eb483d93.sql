
-- Insert an API key for Hayes Recruiting Solutions (one-time data seed, not a schema change)
-- Using a DO block so this runs as a privileged operation
DO $$
BEGIN
  INSERT INTO public.org_api_keys (organization_id, label, api_key)
  VALUES (
    '84214b48-7b51-45bc-ad7f-723bcf50466c',
    'hayesairecruiting.com',
    encode(gen_random_bytes(32), 'hex')
  );
END $$;
