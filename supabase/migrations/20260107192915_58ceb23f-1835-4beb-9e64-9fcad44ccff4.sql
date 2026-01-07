-- Allow anonymous visitors to insert/update their own session data for tracking
CREATE POLICY "Allow anonymous session tracking"
ON visitor_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous session update"
ON visitor_sessions FOR UPDATE
USING (true)
WITH CHECK (true);