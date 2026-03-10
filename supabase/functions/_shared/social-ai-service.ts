/**
 * Social AI Service
 * Centralized AI processing for social media engagement
 * Handles intent classification, sentiment analysis, and response generation
 */

import { getServiceClient } from './supabase-client.ts';
import { createLogger } from './logger.ts';

const logger = createLogger('social-ai-service');

// ============= Types =============

export type SocialPlatform = 'facebook' | 'instagram' | 'whatsapp' | 'twitter' | 'linkedin';

export type IntentType = 
  | 'job_inquiry' 
  | 'support' 
  | 'complaint' 
  | 'spam' 
  | 'general' 
  | 'application_status' 
  | 'salary_question' 
  | 'benefits_question';

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export interface ClassificationResult {
  intent: IntentType;
  confidence: number;
  sentiment: SentimentLabel;
  sentimentScore: number;
  isJobRelated: boolean;
  requiresHumanReview: boolean;
  reviewReason?: string;
  suggestedAction: 'auto_respond' | 'queue_review' | 'ignore';
  extractedEntities: {
    jobTitle?: string;
    location?: string;
    experienceLevel?: string;
    cdlType?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface ResponseGenerationRequest {
  platform: SocialPlatform;
  interactionType: string;
  content: string;
  senderName?: string;
  intent: IntentType;
  sentiment: SentimentLabel;
  extractedEntities: Record<string, string>;
  organizationName: string;
  organizationId: string;
  applyUrl?: string;
  jobTitle?: string;
  customInstructions?: string;
}

export interface GeneratedResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  alternativeResponses?: string[];
}

// ============= Platform Configs =============

const PLATFORM_CONFIGS: Record<SocialPlatform, {
  maxLength: number;
  tone: string;
  allowEmojis: boolean;
  hashtagsAllowed: boolean;
}> = {
  facebook: {
    maxLength: 8000,
    tone: 'warm and professional',
    allowEmojis: true,
    hashtagsAllowed: false,
  },
  instagram: {
    maxLength: 2200,
    tone: 'friendly and engaging',
    allowEmojis: true,
    hashtagsAllowed: true,
  },
  whatsapp: {
    maxLength: 4096,
    tone: 'conversational and helpful',
    allowEmojis: true,
    hashtagsAllowed: false,
  },
  twitter: {
    maxLength: 280,
    tone: 'concise and professional',
    allowEmojis: true,
    hashtagsAllowed: true,
  },
  linkedin: {
    maxLength: 3000,
    tone: 'professional and career-focused',
    allowEmojis: false,
    hashtagsAllowed: true,
  },
};

// ============= Classification =============

const CLASSIFICATION_SYSTEM_PROMPT = `You are an AI classifier for a trucking company's recruiting team. Analyze incoming social media messages and classify them.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "intent": "job_inquiry|support|complaint|spam|general|application_status|salary_question|benefits_question",
  "confidence": 0.0-1.0,
  "sentiment": "positive|neutral|negative",
  "sentimentScore": -1.0 to 1.0,
  "isJobRelated": true|false,
  "requiresHumanReview": true|false,
  "reviewReason": "optional reason if human review needed",
  "suggestedAction": "auto_respond|queue_review|ignore",
  "extractedEntities": {
    "jobTitle": "optional",
    "location": "optional",
    "experienceLevel": "optional",
    "cdlType": "optional",
    "urgency": "low|medium|high"
  }
}

Classification Rules:
- job_inquiry: Questions about job openings, how to apply, requirements
- support: Help with existing application, account issues
- complaint: Negative feedback about hiring process, company
- spam: Irrelevant, promotional, or bot messages
- general: Greetings, thank you messages, general questions
- application_status: Checking on submitted application
- salary_question: Questions about pay, compensation
- benefits_question: Questions about benefits, insurance, PTO

Require human review if:
- Complaint or very negative sentiment (score < -0.5)
- Legal topics mentioned (discrimination, harassment, lawsuit)
- Confidence is below 0.7
- Message contains threats or profanity

Suggest ignore if:
- Obvious spam or bot message
- Completely irrelevant to recruiting`;

export async function classifyInteraction(
  content: string,
  platform: SocialPlatform,
  context?: {
    postContent?: string;
    previousMessages?: string[];
  }
): Promise<ClassificationResult> {
  const supabase = getServiceClient();
  
  const contextInfo = context?.postContent 
    ? `\n\nOriginal post being commented on: "${context.postContent}"` 
    : '';
  
  const previousContext = context?.previousMessages?.length
    ? `\n\nPrevious messages in conversation:\n${context.previousMessages.join('\n')}`
    : '';

  const userMessage = `Platform: ${platform}
Message to classify: "${content}"${contextInfo}${previousContext}`;

  try {
    // Try Anthropic first (better at nuanced classification)
    const { data, error } = await supabase.functions.invoke('anthropic-chat', {
      body: {
        message: userMessage,
        systemPrompt: CLASSIFICATION_SYSTEM_PROMPT,
        model: 'claude-3-haiku-20240307',
        temperature: 0.1,
        maxTokens: 500,
      },
    });

    if (error) throw error;

    const responseText = data?.generatedText || data?.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in classification response');
    }

    const result = JSON.parse(jsonMatch[0]) as ClassificationResult;
    
    // Validate and normalize
    return {
      intent: result.intent || 'general',
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      sentiment: result.sentiment || 'neutral',
      sentimentScore: Math.max(-1, Math.min(1, result.sentimentScore || 0)),
      isJobRelated: result.isJobRelated ?? false,
      requiresHumanReview: result.requiresHumanReview ?? false,
      reviewReason: result.reviewReason,
      suggestedAction: result.suggestedAction || 'queue_review',
      extractedEntities: result.extractedEntities || {},
    };
  } catch (error) {
    logger.error('Classification failed', { error: error.message });
    
    // Fallback classification based on keywords
    return fallbackClassification(content);
  }
}

function fallbackClassification(content: string): ClassificationResult {
  const lowerContent = content.toLowerCase();
  
  // Job-related keywords
  const jobKeywords = ['job', 'hiring', 'apply', 'driver', 'cdl', 'truck', 'position', 'work', 'career', 'opportunity'];
  const supportKeywords = ['help', 'application', 'status', 'submitted', 'interview', 'update'];
  const complaintKeywords = ['frustrated', 'angry', 'terrible', 'worst', 'never', 'lawsuit', 'discrimination'];
  const spamKeywords = ['click here', 'free money', 'bitcoin', 'crypto', 'prize', 'winner'];
  const salaryKeywords = ['pay', 'salary', 'wage', 'compensation', 'per mile', 'cpm', 'bonus'];
  const benefitsKeywords = ['benefits', 'insurance', 'health', '401k', 'pto', 'vacation', 'retirement',
    'medical', 'dental', 'vision', 'home time', 'pet friendly', 'sign on', 'paid orientation',
    'safety bonus', 'rider policy', 'direct deposit', 'referral bonus', 'no touch freight'];

  const hasJobKeywords = jobKeywords.some(k => lowerContent.includes(k));
  const hasSupportKeywords = supportKeywords.some(k => lowerContent.includes(k));
  const hasComplaintKeywords = complaintKeywords.some(k => lowerContent.includes(k));
  const hasSpamKeywords = spamKeywords.some(k => lowerContent.includes(k));
  const hasSalaryKeywords = salaryKeywords.some(k => lowerContent.includes(k));
  const hasBenefitsKeywords = benefitsKeywords.some(k => lowerContent.includes(k));

  let intent: IntentType = 'general';
  let suggestedAction: 'auto_respond' | 'queue_review' | 'ignore' = 'queue_review';

  if (hasSpamKeywords) {
    intent = 'spam';
    suggestedAction = 'ignore';
  } else if (hasComplaintKeywords) {
    intent = 'complaint';
    suggestedAction = 'queue_review';
  } else if (hasSalaryKeywords) {
    intent = 'salary_question';
    suggestedAction = 'auto_respond';
  } else if (hasBenefitsKeywords) {
    intent = 'benefits_question';
    suggestedAction = 'auto_respond';
  } else if (hasSupportKeywords) {
    intent = hasJobKeywords ? 'application_status' : 'support';
    suggestedAction = 'queue_review';
  } else if (hasJobKeywords) {
    intent = 'job_inquiry';
    suggestedAction = 'auto_respond';
  }

  return {
    intent,
    confidence: 0.6,
    sentiment: hasComplaintKeywords ? 'negative' : 'neutral',
    sentimentScore: hasComplaintKeywords ? -0.5 : 0,
    isJobRelated: hasJobKeywords || hasSalaryKeywords || hasBenefitsKeywords,
    requiresHumanReview: hasComplaintKeywords || intent === 'support',
    reviewReason: hasComplaintKeywords ? 'Potential complaint detected' : undefined,
    suggestedAction,
    extractedEntities: {},
  };
}

// ============= Response Generation =============

function buildResponseSystemPrompt(request: ResponseGenerationRequest): string {
  const config = PLATFORM_CONFIGS[request.platform];
  
  return `You are a friendly, professional recruiting assistant for ${request.organizationName}, a trucking company hiring CDL drivers.

PLATFORM: ${request.platform.toUpperCase()}
CHARACTER LIMIT: ${config.maxLength} characters (STRICT - responses must be shorter)
TONE: ${config.tone}
EMOJIS: ${config.allowEmojis ? 'Allowed sparingly' : 'Not allowed'}
HASHTAGS: ${config.hashtagsAllowed ? 'Can use 1-2 relevant hashtags' : 'Do not use hashtags'}

RESPONDING TO: ${request.interactionType}
DETECTED INTENT: ${request.intent}
SENDER SENTIMENT: ${request.sentiment}

GUIDELINES:
1. Be helpful and encouraging to potential driver applicants
2. Never make specific salary promises or guarantees
3. Always maintain EEOC compliance - no discriminatory language
4. Include a clear call-to-action when appropriate
5. Personalize using the sender's name when available
6. Keep responses concise and actionable

${request.applyUrl ? `APPLY LINK: ${request.applyUrl}` : ''}
${request.jobTitle ? `JOB MENTIONED: ${request.jobTitle}` : ''}
${request.customInstructions ? `ADDITIONAL INSTRUCTIONS: ${request.customInstructions}` : ''}

IMPORTANT: 
- If asked about specific salaries, say compensation is competitive and varies based on experience
- If asked about application status, direct them to check email or contact HR
- If complaint, acknowledge their concerns professionally and offer to escalate
- NEVER provide personal information about other employees or applicants`;
}

export async function generateResponse(
  request: ResponseGenerationRequest
): Promise<GeneratedResponse> {
  const supabase = getServiceClient();
  const config = PLATFORM_CONFIGS[request.platform];
  
  const systemPrompt = buildResponseSystemPrompt(request);
  
  const userPrompt = `Original message from ${request.senderName || 'user'}:
"${request.content}"

${Object.keys(request.extractedEntities).length > 0 
  ? `Detected context: ${JSON.stringify(request.extractedEntities)}` 
  : ''}

Generate a ${config.tone} response appropriate for ${request.platform}. 
Keep it under ${Math.min(config.maxLength, 500)} characters for readability.`;

  try {
    // Try Anthropic first for quality
    const { data, error } = await supabase.functions.invoke('anthropic-chat', {
      body: {
        message: userPrompt,
        systemPrompt,
        model: 'claude-3-haiku-20240307',
        temperature: 0.7,
        maxTokens: 600,
      },
    });

    if (error) throw error;

    let responseContent = data?.generatedText || data?.text || '';
    
    // Enforce character limit
    if (responseContent.length > config.maxLength) {
      responseContent = responseContent.substring(0, config.maxLength - 3) + '...';
    }

    return {
      content: responseContent.trim(),
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      tokensUsed: data?.usage?.totalTokens || 0,
    };
  } catch (anthropicError) {
    logger.warn('Anthropic failed, trying OpenAI', { error: anthropicError.message });
    
    try {
      // Fallback to OpenAI
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          message: userPrompt,
          systemPrompt,
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 600,
        },
      });

      if (error) throw error;

      let responseContent = data?.generatedText || data?.text || '';
      
      if (responseContent.length > config.maxLength) {
        responseContent = responseContent.substring(0, config.maxLength - 3) + '...';
      }

      return {
        content: responseContent.trim(),
        provider: 'openai',
        model: 'gpt-4o-mini',
        tokensUsed: data?.usage?.totalTokens || 0,
      };
    } catch (openaiError) {
      logger.error('All AI providers failed', { anthropicError, openaiError });
      throw new Error('Failed to generate response with all available AI providers');
    }
  }
}

// ============= Template Matching =============

export async function findMatchingTemplate(
  organizationId: string,
  intent: IntentType,
  platform?: SocialPlatform
): Promise<{
  id: string;
  content: string;
  variables: string[];
} | null> {
  const supabase = getServiceClient();
  
  let query = supabase
    .from('social_response_templates')
    .select('id, template_content, variables')
    .eq('organization_id', organizationId)
    .eq('intent_type', intent)
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(1);
  
  if (platform) {
    query = query.or(`platform.eq.${platform},platform.is.null`);
  }

  const { data, error } = await query.single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    content: data.template_content,
    variables: (data.variables as string[]) || [],
  };
}

export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    result = result.replace(regex, value);
  }
  
  // Remove any remaining unmatched variables
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  return result.trim();
}

// ============= Content Moderation =============

const BLOCKED_TOPICS = [
  'lawsuit', 'discrimination', 'harassment', 'sue', 'attorney', 'lawyer',
  'eeoc', 'ada', 'fmla', 'workers comp', 'retaliation',
];

const PROFANITY_PATTERNS = [
  /\bf[*@#$%]ck/i, /\bsh[*@#$%]t/i, /\ba[*@#$%]{2}hole/i,
  /\bb[*@#$%]tch/i, /\bd[*@#$%]mn/i,
];

export function moderateContent(content: string): {
  isBlocked: boolean;
  reason?: string;
  sanitizedContent?: string;
} {
  const lowerContent = content.toLowerCase();
  
  // Check for blocked topics
  for (const topic of BLOCKED_TOPICS) {
    if (lowerContent.includes(topic)) {
      return {
        isBlocked: true,
        reason: `Contains sensitive topic: ${topic}`,
      };
    }
  }
  
  // Check for profanity
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isBlocked: true,
        reason: 'Contains profanity - requires human review',
      };
    }
  }
  
  return {
    isBlocked: false,
    sanitizedContent: content,
  };
}

// ============= Metrics Tracking =============

export async function recordInteractionMetrics(
  organizationId: string,
  platform: SocialPlatform,
  metrics: {
    interactionsReceived?: number;
    jobInquiriesReceived?: number;
    autoResponsesSent?: number;
    manualResponsesSent?: number;
    escalatedCount?: number;
    responseTimeSeconds?: number;
    sentiment?: SentimentLabel;
  }
): Promise<void> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split('T')[0];
  
  // Upsert daily metrics
  const { error } = await supabase
    .from('social_engagement_metrics')
    .upsert({
      organization_id: organizationId,
      platform,
      date: today,
      interactions_received: metrics.interactionsReceived || 0,
      job_inquiries_received: metrics.jobInquiriesReceived || 0,
      auto_responses_sent: metrics.autoResponsesSent || 0,
      manual_responses_sent: metrics.manualResponsesSent || 0,
      escalated_count: metrics.escalatedCount || 0,
      sentiment_positive: metrics.sentiment === 'positive' ? 1 : 0,
      sentiment_neutral: metrics.sentiment === 'neutral' ? 1 : 0,
      sentiment_negative: metrics.sentiment === 'negative' ? 1 : 0,
    }, {
      onConflict: 'organization_id,platform,date',
      ignoreDuplicates: false,
    });
  
  if (error) {
    logger.error('Failed to record metrics', { error: error.message });
  }
}
