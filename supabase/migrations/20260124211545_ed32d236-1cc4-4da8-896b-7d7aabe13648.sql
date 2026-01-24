-- Move Hayes job listings from CR England to Hayes and assign correct clients
UPDATE job_listings
SET 
  organization_id = '84214b48-7b51-45bc-ad7f-723bcf50466c', -- Hayes Recruiting
  client_id = CASE 
    WHEN LEFT(job_id, 5) = '13979' THEN '1d54e463-4d7f-4a05-8189-3e33d0586dea' -- Danny Herman Trucking
    WHEN LEFT(job_id, 5) = '14204' THEN '1d54e463-4d7f-4a05-8189-3e33d0586dea' -- Danny Herman Trucking
    WHEN LEFT(job_id, 5) = '14294' THEN '67cadf11-8cce-41c6-8e19-7d2bb0be3b03' -- Pemberton Truck Lines
    WHEN LEFT(job_id, 5) = '14361' THEN '67cadf11-8cce-41c6-8e19-7d2bb0be3b03' -- Pemberton Truck Lines
    ELSE client_id
  END,
  updated_at = now()
WHERE organization_id = '682af95c-e95a-4e21-8753-ddef7f8c1749' -- CR England
  AND job_id IS NOT NULL
  AND LENGTH(job_id) >= 5
  AND LEFT(job_id, 5) IN ('13979', '14204', '14294', '14361');