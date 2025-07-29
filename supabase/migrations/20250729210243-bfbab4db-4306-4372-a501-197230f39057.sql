-- Add Google Jobs as a platform
INSERT INTO public.platforms (name, logo_url, api_endpoint) 
VALUES (
  'Google Jobs',
  'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png',
  'https://jobs.google.com/'
);