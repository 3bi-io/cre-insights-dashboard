-- Create SMS conversations table
CREATE TABLE public.sms_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.recruiters(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS messages table
CREATE TABLE public.sms_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.sms_conversations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('recruiter', 'applicant')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  twilio_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on SMS tables
ALTER TABLE public.sms_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for SMS conversations
CREATE POLICY "Admins can manage all SMS conversations" 
ON public.sms_conversations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recruiters can view their SMS conversations" 
ON public.sms_conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.recruiters 
    WHERE recruiters.id = sms_conversations.recruiter_id 
    AND recruiters.user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can create SMS conversations" 
ON public.sms_conversations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recruiters 
    WHERE recruiters.id = sms_conversations.recruiter_id 
    AND recruiters.user_id = auth.uid()
  )
);

-- RLS policies for SMS messages
CREATE POLICY "Admins can manage all SMS messages" 
ON public.sms_messages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recruiters can view their SMS messages" 
ON public.sms_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sms_conversations sc
    JOIN public.recruiters r ON r.id = sc.recruiter_id
    WHERE sc.id = sms_messages.conversation_id 
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can create SMS messages" 
ON public.sms_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sms_conversations sc
    JOIN public.recruiters r ON r.id = sc.recruiter_id
    WHERE sc.id = sms_messages.conversation_id 
    AND r.user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_sms_conversations_application_id ON public.sms_conversations(application_id);
CREATE INDEX idx_sms_conversations_recruiter_id ON public.sms_conversations(recruiter_id);
CREATE INDEX idx_sms_messages_conversation_id ON public.sms_messages(conversation_id);

-- Add triggers for updated_at
CREATE TRIGGER update_sms_conversations_updated_at
  BEFORE UPDATE ON public.sms_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();