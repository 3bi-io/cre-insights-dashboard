-- =============================================
-- SOCIAL MEDIA AUTO-ENGAGEMENT SYSTEM SCHEMA
-- =============================================

-- 1. Social Platform Connections (OAuth tokens, page IDs, etc.)
CREATE TABLE public.social_platform_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'whatsapp', 'twitter', 'linkedin')),
  platform_user_id TEXT,
  platform_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  page_id TEXT,
  page_name TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  webhook_secret TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  auto_respond_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, platform, page_id)
);

-- 2. Social Interactions (incoming messages, comments, mentions)
CREATE TABLE public.social_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.social_platform_connections(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'whatsapp', 'twitter', 'linkedin')),
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('comment', 'dm', 'mention', 'reply', 'story_mention', 'quote_tweet', 'inmail')),
  platform_message_id TEXT,
  platform_conversation_id TEXT,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  sender_handle TEXT,
  sender_profile_url TEXT,
  sender_avatar_url TEXT,
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::jsonb,
  parent_id UUID REFERENCES public.social_interactions(id),
  post_id TEXT,
  post_content TEXT,
  intent_classification TEXT CHECK (intent_classification IN ('job_inquiry', 'support', 'complaint', 'spam', 'general', 'application_status', 'salary_question', 'benefits_question')),
  intent_confidence NUMERIC(3,2),
  sentiment_score NUMERIC(3,2),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  is_job_related BOOLEAN DEFAULT false,
  extracted_entities JSONB DEFAULT '{}'::jsonb,
  requires_response BOOLEAN DEFAULT true,
  requires_human_review BOOLEAN DEFAULT false,
  review_reason TEXT,
  auto_responded BOOLEAN DEFAULT false,
  responded_at TIMESTAMP WITH TIME ZONE,
  response_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'responded', 'escalated', 'ignored', 'archived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Social Responses (outgoing messages)
CREATE TABLE public.social_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interaction_id UUID NOT NULL REFERENCES public.social_interactions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  response_type TEXT DEFAULT 'auto' CHECK (response_type IN ('auto', 'manual', 'template', 'edited_auto')),
  content TEXT NOT NULL,
  original_ai_content TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  tokens_used INTEGER,
  template_id UUID,
  edited_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  platform_response_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Social Engagement Metrics (daily analytics)
CREATE TABLE public.social_engagement_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  interactions_received INTEGER DEFAULT 0,
  job_inquiries_received INTEGER DEFAULT 0,
  auto_responses_sent INTEGER DEFAULT 0,
  manual_responses_sent INTEGER DEFAULT 0,
  escalated_count INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  conversion_to_application INTEGER DEFAULT 0,
  sentiment_positive INTEGER DEFAULT 0,
  sentiment_neutral INTEGER DEFAULT 0,
  sentiment_negative INTEGER DEFAULT 0,
  top_intents JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, platform, date)
);

-- 5. Social Response Templates
CREATE TABLE public.social_response_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  platform TEXT,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_social_interactions_org_platform ON public.social_interactions(organization_id, platform);
CREATE INDEX idx_social_interactions_status ON public.social_interactions(status);
CREATE INDEX idx_social_interactions_created ON public.social_interactions(created_at DESC);
CREATE INDEX idx_social_interactions_sender ON public.social_interactions(sender_id);
CREATE INDEX idx_social_interactions_intent ON public.social_interactions(intent_classification);
CREATE INDEX idx_social_interactions_requires_review ON public.social_interactions(requires_human_review) WHERE requires_human_review = true;

CREATE INDEX idx_social_responses_interaction ON public.social_responses(interaction_id);
CREATE INDEX idx_social_responses_status ON public.social_responses(status);

CREATE INDEX idx_social_metrics_org_date ON public.social_engagement_metrics(organization_id, date DESC);

CREATE INDEX idx_social_templates_org_intent ON public.social_response_templates(organization_id, intent_type);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.social_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_response_templates ENABLE ROW LEVEL SECURITY;

-- Connections: org members can view, admins can modify
CREATE POLICY "Org members can view connections" ON public.social_platform_connections
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org admins can manage connections" ON public.social_platform_connections
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Interactions: org members can view and update
CREATE POLICY "Org members can view interactions" ON public.social_interactions
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org members can update interactions" ON public.social_interactions
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Responses: org members can view and manage
CREATE POLICY "Org members can view responses" ON public.social_responses
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org members can manage responses" ON public.social_responses
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Metrics: org members can view
CREATE POLICY "Org members can view metrics" ON public.social_engagement_metrics
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Templates: org members can view and manage
CREATE POLICY "Org members can view templates" ON public.social_response_templates
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Org members can manage templates" ON public.social_response_templates
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Service role policies for webhooks (edge functions)
CREATE POLICY "Service role full access connections" ON public.social_platform_connections
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access interactions" ON public.social_interactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access responses" ON public.social_responses
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access metrics" ON public.social_engagement_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access templates" ON public.social_response_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_social_platform_connections_updated_at
  BEFORE UPDATE ON public.social_platform_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_interactions_updated_at
  BEFORE UPDATE ON public.social_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_responses_updated_at
  BEFORE UPDATE ON public.social_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_engagement_metrics_updated_at
  BEFORE UPDATE ON public.social_engagement_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_response_templates_updated_at
  BEFORE UPDATE ON public.social_response_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();