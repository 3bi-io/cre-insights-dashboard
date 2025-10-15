-- Create enum for screening request types
CREATE TYPE screening_request_type AS ENUM (
  'background_check',
  'employment_application',
  'drug_screening'
);

-- Create enum for screening request status
CREATE TYPE screening_request_status AS ENUM (
  'pending',
  'sent',
  'completed',
  'failed',
  'expired'
);

-- Create table for screening requests
CREATE TABLE public.screening_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  request_type screening_request_type NOT NULL,
  status screening_request_status NOT NULL DEFAULT 'pending',
  provider_name TEXT,
  provider_reference_id TEXT,
  request_data JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for application documents
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  screening_request_id UUID REFERENCES public.screening_requests(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'application-documents',
  'application-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Enable RLS on screening_requests
ALTER TABLE public.screening_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for screening_requests
CREATE POLICY "Super admins can manage all screening requests"
  ON public.screening_requests
  FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage screening requests in their org"
  ON public.screening_requests
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = screening_requests.application_id
      AND jl.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Job owners can view screening requests for their applications"
  ON public.screening_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = screening_requests.application_id
      AND jl.user_id = auth.uid()
    )
  );

-- Enable RLS on application_documents
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for application_documents
CREATE POLICY "Super admins can manage all documents"
  ON public.application_documents
  FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Org admins can manage documents in their org"
  ON public.application_documents
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = application_documents.application_id
      AND jl.organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Job owners can view documents for their applications"
  ON public.application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = application_documents.application_id
      AND jl.user_id = auth.uid()
    )
  );

-- Storage policies for application-documents bucket
CREATE POLICY "Admins can upload application documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'application-documents' AND
    (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Admins can view application documents in their org"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'application-documents' AND
    (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Admins can update application documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'application-documents' AND
    (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Admins can delete application documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'application-documents' AND
    (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
  );

-- Create indexes for performance
CREATE INDEX idx_screening_requests_application_id ON public.screening_requests(application_id);
CREATE INDEX idx_screening_requests_status ON public.screening_requests(status);
CREATE INDEX idx_screening_requests_type ON public.screening_requests(request_type);
CREATE INDEX idx_application_documents_application_id ON public.application_documents(application_id);
CREATE INDEX idx_application_documents_screening_request_id ON public.application_documents(screening_request_id);

-- Create trigger for updated_at
CREATE TRIGGER update_screening_requests_updated_at
  BEFORE UPDATE ON public.screening_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();