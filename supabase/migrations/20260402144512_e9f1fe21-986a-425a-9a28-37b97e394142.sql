UPDATE job_listings
SET title = 'LP' || substring(title from 3),
    updated_at = now()
WHERE client_id = 'be8b645e-d480-4c22-8e75-b09a7fc1db7a'
  AND title LIKE 'CO %';