-- Remove duplicate AI settings records, keeping the most recent one for each user
DELETE FROM ai_settings 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM ai_settings
  ) t 
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE ai_settings ADD CONSTRAINT ai_settings_user_id_unique UNIQUE (user_id);