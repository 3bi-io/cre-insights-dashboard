-- Create table for background task tracking
CREATE TABLE public.background_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.background_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tasks" 
ON public.background_tasks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" 
ON public.background_tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_background_tasks_user_status ON public.background_tasks(user_id, status);

-- Create trigger for timestamps
CREATE TRIGGER update_background_tasks_updated_at
BEFORE UPDATE ON public.background_tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();