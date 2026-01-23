-- Create email_preferences table for managing unsubscribe settings
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  marketing_emails BOOLEAN DEFAULT true,
  application_updates BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own email preferences" 
  ON public.email_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own email preferences" 
  ON public.email_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own email preferences" 
  ON public.email_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all preferences (for unsubscribe links)
CREATE POLICY "Service role full access to email preferences"
  ON public.email_preferences
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create index for fast token lookups
CREATE INDEX idx_email_preferences_token ON public.email_preferences(unsubscribe_token);
CREATE INDEX idx_email_preferences_email ON public.email_preferences(email);

-- Add updated_at trigger
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();