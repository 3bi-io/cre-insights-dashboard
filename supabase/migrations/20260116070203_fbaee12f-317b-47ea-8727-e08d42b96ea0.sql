-- Remove redundant 'user' role from andrew@aspenanalytics.io (super_admin already grants all permissions)
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'andrew@aspenanalytics.io')
AND role = 'user';