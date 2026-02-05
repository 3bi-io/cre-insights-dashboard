-- Update logo URLs for clients
UPDATE public.clients 
SET logo_url = 'https://images.seeklogo.com/logo-png/52/2/day-ross-logo-png_seeklogo-525241.png',
    updated_at = now()
WHERE id = '30ab5f68-258c-4e81-8217-1123c4536259';

UPDATE public.clients 
SET logo_url = 'https://d2r0eic16r3uxv.cloudfront.net/1626806418007171.png',
    updated_at = now()
WHERE id = '4a9ef1df-dcc9-499c-999a-446bb9a329fc';

UPDATE public.clients 
SET logo_url = 'https://d2r0eic16r3uxv.cloudfront.net/1635879404137815.png',
    updated_at = now()
WHERE id = '1d54e463-4d7f-4a05-8189-3e33d0586dea';