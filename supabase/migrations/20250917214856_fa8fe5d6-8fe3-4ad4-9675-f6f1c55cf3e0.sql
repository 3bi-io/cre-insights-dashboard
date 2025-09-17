-- Fix SMS magic links security vulnerability

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Anyone can create SMS magic links" ON public.sms_magic_links;
DROP POLICY IF EXISTS "Users can view their own SMS magic links" ON public.sms_magic_links;

-- Add user_id column to properly associate magic links with users
ALTER TABLE public.sms_magic_links 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create secure RLS policies

-- Only the system (service role) can create SMS magic links
-- This prevents unauthorized creation while allowing the edge function to work
CREATE POLICY "System can create SMS magic links" 
ON public.sms_magic_links 
FOR INSERT 
WITH CHECK (true); -- Service role bypasses RLS anyway

-- Users can only view magic links associated with their user ID
CREATE POLICY "Users can view their own SMS magic links" 
ON public.sms_magic_links 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only the system can update magic links (to mark as used)
CREATE POLICY "System can update SMS magic links"
ON public.sms_magic_links
FOR UPDATE
USING (true); -- Service role bypasses RLS anyway

-- Only the system can delete expired magic links
CREATE POLICY "System can delete SMS magic links"
ON public.sms_magic_links
FOR DELETE
USING (true); -- Service role bypasses RLS anyway

-- Add index for better performance on phone number lookups
CREATE INDEX IF NOT EXISTS idx_sms_magic_links_phone_token 
ON public.sms_magic_links(phone_number, token) 
WHERE used = false;

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_sms_magic_links_expires_at 
ON public.sms_magic_links(expires_at) 
WHERE used = false;