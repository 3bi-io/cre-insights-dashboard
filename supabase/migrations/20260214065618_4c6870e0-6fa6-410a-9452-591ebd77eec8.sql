
ALTER TABLE generated_ad_creatives 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft';

CREATE INDEX IF NOT EXISTS idx_ad_creatives_status 
  ON generated_ad_creatives(status) 
  WHERE status IN ('draft', 'ready', 'queued');
