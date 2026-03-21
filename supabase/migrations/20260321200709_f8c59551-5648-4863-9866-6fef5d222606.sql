-- Clean up duplicate roles for cody@3bi.io (user_id: c259635f-fc7c-4a4e-8a45-29bcbcbd66bc)
-- Keep only the 'client' role, remove 'admin' and 'user' duplicates
DELETE FROM public.user_roles 
WHERE user_id = 'c259635f-fc7c-4a4e-8a45-29bcbcbd66bc' 
  AND role != 'client';