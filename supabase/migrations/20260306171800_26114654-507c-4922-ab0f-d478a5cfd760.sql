-- Create Cybersecurity job category
INSERT INTO public.job_categories (id, name)
VALUES (gen_random_uuid(), 'Cybersecurity')
ON CONFLICT DO NOTHING;