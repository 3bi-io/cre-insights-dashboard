-- Re-enable Jimmy Hayes' profile (truckinjimmyhayes@gmail.com)
UPDATE public.profiles 
SET enabled = true, updated_at = now() 
WHERE id = 'f0e9f8ad-ee1f-42d7-a640-7ca5489ebf60';