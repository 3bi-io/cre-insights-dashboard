
-- Upload logo to storage bucket and update client record
-- Since we can't upload via anon key due to RLS, we'll use the Wix CDN URL directly
-- but with higher quality parameters for a better logo
UPDATE public.clients
SET logo_url = 'https://static.wixstatic.com/media/ec2930_4a3897f848fd4c05a3aefe8fd391a2f6~mv2.jpg/v1/fill/w_600,h_300,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/ec2930_4a3897f848fd4c05a3aefe8fd391a2f6~mv2.jpg',
    updated_at = now()
WHERE id = 'cc4a05e9-2c87-4e71-b7f5-49d8bd709540';
