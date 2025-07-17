-- Create table for SMS magic links
CREATE TABLE public.sms_magic_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.sms_magic_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create SMS magic links" 
ON public.sms_magic_links 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own SMS magic links" 
ON public.sms_magic_links 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create function to clean up expired SMS links
CREATE OR REPLACE FUNCTION public.cleanup_expired_sms_links()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.sms_magic_links
  WHERE expires_at < now();
END;
$$;