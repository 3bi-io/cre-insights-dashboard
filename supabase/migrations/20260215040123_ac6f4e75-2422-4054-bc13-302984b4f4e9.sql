
-- Saved filter presets for recruiters
CREATE TABLE public.saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  view_type TEXT NOT NULL DEFAULT 'applications', -- 'applications', 'jobs', 'clients'
  filter_config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can manage their own saved filters
CREATE POLICY "Users can view their own saved filters"
  ON public.saved_filters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved filters"
  ON public.saved_filters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters"
  ON public.saved_filters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters"
  ON public.saved_filters FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_saved_filters_user ON public.saved_filters(user_id);
CREATE INDEX idx_saved_filters_view ON public.saved_filters(user_id, view_type);

-- Trigger for updated_at
CREATE TRIGGER update_saved_filters_updated_at
  BEFORE UPDATE ON public.saved_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
