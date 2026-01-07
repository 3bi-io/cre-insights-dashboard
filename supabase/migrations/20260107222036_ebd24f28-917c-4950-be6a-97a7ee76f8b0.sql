-- Allow anonymous visitors to read session data (needed for upsert to work correctly)
-- This table contains only analytics data, no sensitive PII
CREATE POLICY "Allow anonymous session read"
ON visitor_sessions FOR SELECT
USING (true);