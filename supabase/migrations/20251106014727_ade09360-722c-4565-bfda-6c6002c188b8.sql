-- Create table for tracking bulk operations
CREATE TABLE IF NOT EXISTS public.tenstreet_bulk_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'export', 'status_update', 'sync_facebook', 'sync_hubspot')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  success_records INTEGER DEFAULT 0,
  file_url TEXT,
  error_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenstreet_bulk_operations ENABLE ROW LEVEL SECURITY;

-- Policies for bulk operations
CREATE POLICY "Users can view their org's bulk operations"
  ON public.tenstreet_bulk_operations
  FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create bulk operations for their org"
  ON public.tenstreet_bulk_operations
  FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their org's bulk operations"
  ON public.tenstreet_bulk_operations
  FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Add trigger for updated_at
CREATE TRIGGER update_tenstreet_bulk_operations_updated_at
  BEFORE UPDATE ON public.tenstreet_bulk_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_tenstreet_bulk_operations_org_id ON public.tenstreet_bulk_operations(organization_id);
CREATE INDEX idx_tenstreet_bulk_operations_status ON public.tenstreet_bulk_operations(status);
CREATE INDEX idx_tenstreet_bulk_operations_created_at ON public.tenstreet_bulk_operations(created_at DESC);