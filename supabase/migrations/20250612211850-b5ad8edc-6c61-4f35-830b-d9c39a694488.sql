
-- Create a table for clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to control access
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create policy that allows authenticated users to view all clients
CREATE POLICY "Authenticated users can view clients" 
  ON public.clients 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy that allows authenticated users to insert clients
CREATE POLICY "Authenticated users can create clients" 
  ON public.clients 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Create policy that allows authenticated users to update clients
CREATE POLICY "Authenticated users can update clients" 
  ON public.clients 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Create policy that allows authenticated users to delete clients
CREATE POLICY "Authenticated users can delete clients" 
  ON public.clients 
  FOR DELETE 
  TO authenticated
  USING (true);
