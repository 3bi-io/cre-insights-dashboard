-- Fix Matthew Pineau's corrupted name fields
UPDATE applications 
SET first_name = 'Matthew', 
    last_name = 'Pineau', 
    full_name = 'Matthew Pineau',
    tenstreet_sync_status = 'pending'
WHERE id = '18867281-ca05-42f3-9cef-9972bb440101';
