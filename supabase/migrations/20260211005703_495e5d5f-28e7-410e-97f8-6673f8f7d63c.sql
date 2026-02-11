-- Reset Pemberton Tenstreet connection from error to active
UPDATE ats_connections 
SET status = 'active', 
    last_error = NULL, 
    updated_at = now() 
WHERE id = 'f987e55a-703e-4cc1-8370-b283c780f547';
