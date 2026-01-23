/**
 * Engagement Responder
 * Generates platform-appropriate responses for social media interactions
 */

import { getServiceClient } from './supabase-client.ts';
import { createLogger } from './logger.ts';
import {
  SocialPlatform,
  IntentType,
  SentimentLabel,
  generateResponse,
  findMatchingTemplate,
  applyTemplateVariables,
  moderateContent,
  GeneratedResponse,
} from './social-ai-service.ts';

const logger = createLogger('engagement-responder');

// ============= Types =============

export interface EngagementContext {
  organizationId: string;
  organizationName: string;
  platform: SocialPlatform;
  interactionType: string;
  interactionId: string;
  content: string;
  senderName?: string;
  senderHandle?: string;
  intent: IntentType;
  sentiment: SentimentLabel;
  extractedEntities: Record<string, string>;
  applyUrl?: string;
  jobListings?: Array<{
    id: string;
    title: string;
    location: string;
    payRange?: string;
  }>;
}

export interface ResponseResult {
  success: boolean;
  content?: string;
  responseId?: string;
  method: 'template' | 'ai' | 'fallback';
  provider?: string;
  model?: string;
  tokensUsed?: number;
  requiresApproval: boolean;
  error?: string;
}

// ============= Response Strategies =============

/**
 * Primary response generation - tries template first, then AI
 */
export async function generateEngagementResponse(
  context: EngagementContext
): Promise<ResponseResult> {
  const supabase = getServiceClient();
  
  // Step 1: Try to find a matching template
  const template = await findMatchingTemplate(
    context.organizationId,
    context.intent,
    context.platform
  );
  
  if (template) {
    const variables = buildTemplateVariables(context);
    const content = applyTemplateVariables(template.content, variables);
    
    // Moderate the templated content
    const moderation = moderateContent(content);
    if (moderation.isBlocked) {
      logger.warn('Template content blocked', { reason: moderation.reason });
    } else {
      // Update template usage count
      await supabase
        .from('social_response_templates')
        .update({ 
          usage_count: template.id, 
          last_used_at: new Date().toISOString() 
        })
        .eq('id', template.id);
      
      return {
        success: true,
        content: moderation.sanitizedContent || content,
        method: 'template',
        requiresApproval: context.sentiment === 'negative',
      };
    }
  }
  
  // Step 2: Generate AI response
  try {
    const aiResponse = await generateResponse({
      platform: context.platform,
      interactionType: context.interactionType,
      content: context.content,
      senderName: context.senderName,
      intent: context.intent,
      sentiment: context.sentiment,
      extractedEntities: context.extractedEntities,
      organizationName: context.organizationName,
      organizationId: context.organizationId,
      applyUrl: context.applyUrl,
      jobTitle: context.extractedEntities.jobTitle,
    });
    
    // Moderate AI response
    const moderation = moderateContent(aiResponse.content);
    if (moderation.isBlocked) {
      return {
        success: false,
        method: 'ai',
        requiresApproval: true,
        error: `AI response blocked: ${moderation.reason}`,
      };
    }
    
    return {
      success: true,
      content: moderation.sanitizedContent || aiResponse.content,
      method: 'ai',
      provider: aiResponse.provider,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      requiresApproval: context.sentiment === 'negative' || context.intent === 'complaint',
    };
  } catch (error) {
    logger.error('AI response generation failed', { error: error.message });
    
    // Step 3: Use fallback response
    const fallback = getFallbackResponse(context);
    return {
      success: true,
      content: fallback,
      method: 'fallback',
      requiresApproval: true,
    };
  }
}

function buildTemplateVariables(context: EngagementContext): Record<string, string> {
  return {
    sender_name: context.senderName || 'there',
    organization_name: context.organizationName,
    apply_url: context.applyUrl || '',
    job_title: context.extractedEntities.jobTitle || 'CDL Driver',
    location: context.extractedEntities.location || '',
    platform: context.platform,
    ...context.extractedEntities,
  };
}

// ============= Fallback Responses =============

const FALLBACK_RESPONSES: Record<IntentType, Record<SocialPlatform, string>> = {
  job_inquiry: {
    facebook: "Thanks for your interest in joining our team! 🚛 We're always looking for great drivers. Check out our current openings and apply online. Feel free to DM us with any questions!",
    instagram: "Thanks for reaching out! 🚛 We'd love to have you on the team. Check the link in our bio to see current openings and apply!",
    twitter: "Thanks for your interest! 🚛 Check out our open positions and apply today. DM us with questions!",
    whatsapp: "Hi! Thanks for reaching out about driving opportunities. We'd be happy to tell you more about our open positions. What questions can I answer for you?",
    linkedin: "Thank you for your interest in career opportunities with our team. We're always seeking experienced professionals. Please visit our careers page for current openings and application details.",
  },
  salary_question: {
    facebook: "Great question! Our compensation packages are competitive and vary based on experience, route type, and endorsements. Apply to learn more about specific pay details for your situation!",
    instagram: "Good question! 💰 Pay varies by experience and route. Apply to chat with our recruiters about specific details!",
    twitter: "Pay is competitive & based on experience. Apply to discuss specifics with our team! 🚛",
    whatsapp: "Our pay is competitive and depends on your experience, route type, and endorsements. Would you like me to connect you with a recruiter to discuss specifics?",
    linkedin: "Our compensation packages are competitive within the industry and are tailored based on experience, route assignments, and qualifications. I'd encourage you to apply so our recruiting team can provide specific details based on your background.",
  },
  benefits_question: {
    facebook: "We offer comprehensive benefits including medical, dental, vision, 401(k), and paid time off! 🏥 Benefits eligibility and specifics are discussed during the hiring process. Apply to learn more!",
    instagram: "Full benefits package! 🏥 Medical, dental, 401k, PTO & more. Check link in bio to apply and learn details!",
    twitter: "Full benefits: medical, dental, 401k, PTO & more! Apply to learn specifics 🏥",
    whatsapp: "We offer comprehensive benefits including health insurance, 401(k) retirement, and paid time off. Would you like more details about any specific benefit?",
    linkedin: "We provide a comprehensive benefits package including medical, dental, and vision insurance, 401(k) with company match, paid time off, and other perks. Specific details are discussed during the recruitment process.",
  },
  application_status: {
    facebook: "Thanks for following up! 📋 Please check your email (including spam folder) for updates from our recruiting team. If you haven't heard back within 5-7 business days, feel free to reach out to us directly.",
    instagram: "Thanks for checking in! 📋 Keep an eye on your email for updates. DM us if you haven't heard back in a week!",
    twitter: "Check your email for updates! If nothing after 5-7 days, DM us and we'll look into it 📋",
    whatsapp: "I'd be happy to help you check on your application! Can you provide your full name and the position you applied for? I'll see what I can find out.",
    linkedin: "Thank you for your patience. Please check your email for updates from our recruiting team. If you haven't received communication within 7 business days of applying, please reach out directly and we'll be happy to provide an update.",
  },
  support: {
    facebook: "I'm here to help! 🤝 Can you tell me more about what you need assistance with? We'll do our best to get you sorted out.",
    instagram: "Here to help! 🤝 DM us with more details and we'll get back to you ASAP!",
    twitter: "Happy to help! DM us with details and we'll assist 🤝",
    whatsapp: "I'm here to help! What do you need assistance with today?",
    linkedin: "I'd be happy to assist. Could you please provide more details about your inquiry so I can direct you to the appropriate resource?",
  },
  complaint: {
    facebook: "I'm sorry to hear you've had a frustrating experience. 🙏 Your feedback is important to us. Could you please DM us the details so we can look into this and make it right?",
    instagram: "We're sorry to hear this. 🙏 Please DM us the details so we can help resolve this for you.",
    twitter: "Sorry to hear that. Please DM us details so we can look into this 🙏",
    whatsapp: "I'm sorry you've had a frustrating experience. Your feedback matters to us. Can you tell me more about what happened so I can help address this?",
    linkedin: "I apologize for any frustration you've experienced. We take all feedback seriously. Please share the details of your concern, and I'll ensure it reaches the appropriate team for resolution.",
  },
  spam: {
    facebook: "",
    instagram: "",
    twitter: "",
    whatsapp: "",
    linkedin: "",
  },
  general: {
    facebook: "Thanks for reaching out! 👋 How can we help you today?",
    instagram: "Hey! 👋 What can we help you with?",
    twitter: "Hi! How can we help? 👋",
    whatsapp: "Hello! Thanks for reaching out. How can I help you today?",
    linkedin: "Thank you for connecting. How may I assist you?",
  },
};

function getFallbackResponse(context: EngagementContext): string {
  const platformResponses = FALLBACK_RESPONSES[context.intent] || FALLBACK_RESPONSES.general;
  return platformResponses[context.platform] || platformResponses.facebook;
}

// ============= Response Storage =============

export async function saveResponse(
  context: EngagementContext,
  result: ResponseResult
): Promise<string | null> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('social_responses')
    .insert({
      interaction_id: context.interactionId,
      organization_id: context.organizationId,
      platform: context.platform,
      response_type: result.method === 'template' ? 'template' : 'auto',
      content: result.content,
      original_ai_content: result.method === 'ai' ? result.content : null,
      ai_provider: result.provider,
      ai_model: result.model,
      tokens_used: result.tokensUsed,
      status: result.requiresApproval ? 'pending_approval' : 'approved',
    })
    .select('id')
    .single();
  
  if (error) {
    logger.error('Failed to save response', { error: error.message });
    return null;
  }
  
  // Update interaction with response reference
  await supabase
    .from('social_interactions')
    .update({
      response_id: data.id,
      auto_responded: !result.requiresApproval,
      status: result.requiresApproval ? 'processing' : 'responded',
      responded_at: result.requiresApproval ? null : new Date().toISOString(),
    })
    .eq('id', context.interactionId);
  
  return data.id;
}

// ============= Approval Workflow =============

export async function approveResponse(
  responseId: string,
  userId: string,
  editedContent?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient();
  
  const updates: Record<string, unknown> = {
    status: 'approved',
    approved_by: userId,
  };
  
  if (editedContent) {
    updates.content = editedContent;
    updates.response_type = 'edited_auto';
    updates.edited_by = userId;
  }
  
  const { data: response, error } = await supabase
    .from('social_responses')
    .update(updates)
    .eq('id', responseId)
    .select('interaction_id')
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Update interaction status
  await supabase
    .from('social_interactions')
    .update({ status: 'responded' })
    .eq('id', response.interaction_id);
  
  return { success: true };
}

export async function rejectResponse(
  responseId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceClient();
  
  const { data: response, error } = await supabase
    .from('social_responses')
    .update({
      status: 'cancelled',
      error_message: reason || 'Rejected by reviewer',
    })
    .eq('id', responseId)
    .select('interaction_id')
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Update interaction to require manual response
  await supabase
    .from('social_interactions')
    .update({ 
      status: 'escalated',
      requires_human_review: true,
      review_reason: reason || 'AI response rejected',
    })
    .eq('id', response.interaction_id);
  
  return { success: true };
}
