-- Data update: Set AspenView logo on client and organization records
-- Using security definer context to bypass RLS

DO $$
BEGIN
  UPDATE public.clients 
  SET logo_url = 'https://applyai.jobs/logos/aspenview-technology-partners.svg',
      city = 'San Juan', 
      state = 'PR'
  WHERE id = '82513316-7df2-4bf0-83d8-6c511c83ddfb';

  UPDATE public.organizations 
  SET logo_url = 'https://applyai.jobs/logos/aspenview-technology-partners.svg'
  WHERE id = '9335c64c-b793-4578-bf51-63d0c3b5d66d';
END $$;