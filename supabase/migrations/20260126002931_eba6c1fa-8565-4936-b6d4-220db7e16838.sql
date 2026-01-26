-- Clean up malformed applications with [object Object] values
DELETE FROM public.applications 
WHERE source = 'ElevenLabs' 
AND (
  first_name LIKE '%[object%' OR 
  applicant_email LIKE '%[object%' OR 
  phone LIKE '%[object%'
);