-- First create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for AI settings and privacy controls
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  experience_sensitivity NUMERIC DEFAULT 0.5,
  industry_focus TEXT DEFAULT 'general',
  bias_reduction_level NUMERIC DEFAULT 0.8,
  explainability_level TEXT DEFAULT 'medium',
  data_sharing_level TEXT DEFAULT 'internal',
  ai_processing_enabled BOOLEAN DEFAULT true,
  sensitive_data_processing BOOLEAN DEFAULT false,
  data_retention_days INTEGER DEFAULT 365,
  audit_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own AI settings" 
ON public.ai_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI settings" 
ON public.ai_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI settings" 
ON public.ai_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for AI analysis cache
CREATE TABLE public.ai_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  analysis_result JSONB NOT NULL,
  provider TEXT NOT NULL,
  confidence_score NUMERIC,
  processing_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for cache
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for cache (only admins can manage cache)
CREATE POLICY "Admins can manage AI cache" 
ON public.ai_analysis_cache 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for AI metrics tracking
CREATE TABLE public.ai_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  ai_value NUMERIC,
  traditional_value NUMERIC,
  improvement_percentage NUMERIC,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for metrics
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for metrics
CREATE POLICY "Users can view their own AI metrics" 
ON public.ai_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI metrics" 
ON public.ai_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_analysis_cache_key ON public.ai_analysis_cache(cache_key);
CREATE INDEX idx_ai_analysis_cache_expires ON public.ai_analysis_cache(expires_at);
CREATE INDEX idx_ai_metrics_user_date ON public.ai_metrics(user_id, date);
CREATE INDEX idx_ai_settings_user ON public.ai_settings(user_id);

-- Create function for cache cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_analysis_cache
  WHERE expires_at < now();
END;
$$;

-- Create trigger for AI settings timestamps
CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();