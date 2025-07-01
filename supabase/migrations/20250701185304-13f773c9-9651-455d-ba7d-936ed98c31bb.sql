
-- Insert Meta and X as initial platform advertising options
INSERT INTO public.platforms (name, logo_url) VALUES
('Meta', '/platforms/meta.png'),
('X', '/platforms/x.png')
ON CONFLICT (name) DO NOTHING;

-- Update the existing platforms to ensure we have a good set of advertising platforms
-- Remove or update any platforms that might not be relevant for advertising
UPDATE public.platforms 
SET name = 'X' 
WHERE name = 'Indeed' AND NOT EXISTS (SELECT 1 FROM public.platforms WHERE name = 'X');
