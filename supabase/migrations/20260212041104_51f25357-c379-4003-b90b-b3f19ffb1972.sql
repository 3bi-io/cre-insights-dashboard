UPDATE applications 
SET job_listing_id = '6a86d135-aeab-401b-bc00-50f923f81eb5',
    notes = COALESCE(notes || E'\n', '') || '[Admin] Reassigned from Pemberton to Danny Herman Trucking - 2026-02-12'
WHERE id = 'd8012012-0f9a-4237-a4ec-84a0627d427b';