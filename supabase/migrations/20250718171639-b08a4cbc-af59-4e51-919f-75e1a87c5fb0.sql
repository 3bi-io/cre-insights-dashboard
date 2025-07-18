-- Create recruiters table
CREATE TABLE public.recruiters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on recruiters table
ALTER TABLE public.recruiters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for recruiters
CREATE POLICY "Admins can manage all recruiters" 
ON public.recruiters 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view recruiters" 
ON public.recruiters 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Recruiters can view their own profile" 
ON public.recruiters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can update their own profile" 
ON public.recruiters 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add recruiter_id column to applications table
ALTER TABLE public.applications 
ADD COLUMN recruiter_id UUID REFERENCES public.recruiters(id) ON DELETE SET NULL;

-- Create index for better performance on recruiter assignments
CREATE INDEX idx_applications_recruiter_id ON public.applications(recruiter_id);

-- Add RLS policy for recruiters to view their assigned applications
CREATE POLICY "Recruiters can view their assigned applications" 
ON public.applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.recruiters 
    WHERE recruiters.id = applications.recruiter_id 
    AND recruiters.user_id = auth.uid()
  )
);

-- Add RLS policy for recruiters to update their assigned applications
CREATE POLICY "Recruiters can update their assigned applications" 
ON public.applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.recruiters 
    WHERE recruiters.id = applications.recruiter_id 
    AND recruiters.user_id = auth.uid()
  )
);

-- Add trigger for updated_at on recruiters table
CREATE TRIGGER update_recruiters_updated_at
  BEFORE UPDATE ON public.recruiters
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();