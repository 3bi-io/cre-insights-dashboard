-- Create table for storing Tenstreet field mappings
CREATE TABLE public.tenstreet_field_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mapping_name TEXT NOT NULL DEFAULT 'Default Mapping',
  field_mappings JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenstreet_field_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own mappings" 
ON public.tenstreet_field_mappings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mappings" 
ON public.tenstreet_field_mappings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mappings" 
ON public.tenstreet_field_mappings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mappings" 
ON public.tenstreet_field_mappings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tenstreet_field_mappings_updated_at
BEFORE UPDATE ON public.tenstreet_field_mappings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();