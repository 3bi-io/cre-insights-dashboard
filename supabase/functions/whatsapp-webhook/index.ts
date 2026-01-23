/**
 * WhatsApp Business Webhook
 * Handles incoming WhatsApp messages via Meta Business API
 * 
 * Webhook Events:
 * - Text messages
 * - Media messages (images, documents)
 * - Button responses
 * - List responses
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { hybridClassify } from '../_shared/engagement-classifier.ts';
import { generateEngagementResponse, saveResponse } from '../_shared/engagement-responder.ts';
import { recordInteractionMetrics } from '../_shared/social-ai-service.ts';

const logger = createLogger('whatsapp-webhook');

// ============= Types =============

interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: 'messages';
}

interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button';
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  document?: { id: string; mime_type: string; sha256: string; filename: string; caption?: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { text: string; payload: string };
  context?: { from: string; id: string };
}

interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message: string }>;
}

// ============= Webhook Verification =============

function handleVerification(url: URL): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'ats_whatsapp_webhook_2024';
  
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('WhatsApp webhook verification successful');
    return new Response(challenge, { status: 200 });
  }
  
  logger.warn('WhatsApp webhook verification failed', { mode, tokenMatch: token === verifyToken });
  return new Response('Forbidden', { status: 403 });
}

// ============= Message Processing =============

async function processMessage(
  message: WhatsAppMessage,
  contact: WhatsAppContact | undefined,
  phoneNumberId: string
): Promise<void> {
  const supabase = getServiceClient();
  
  // Extract text content
  let content = '';
  let mediaUrls: string[] = [];
  
  switch (message.type) {
    case 'text':
      content = message.text?.body || '';
      break;
    case 'image':
      content = message.image?.caption || '[Image received]';
      break;
    case 'document':
      content = message.document?.caption || `[Document: ${message.document?.filename}]`;
      break;
    case 'interactive':
      if (message.interactive?.button_reply) {
        content = message.interactive.button_reply.title;
      } else if (message.interactive?.list_reply) {
        content = message.interactive.list_reply.title;
      }
      break;
    case 'button':
      content = message.button?.text || '';
      break;
    default:
      content = `[${message.type} message received]`;
  }
  
  if (!content) {
    logger.debug('Skipping empty message', { type: message.type });
    return;
  }
  
  const senderId = message.from;
  const senderName = contact?.profile?.name;
  
  // Find connection for this phone number
  const { data: connection } = await supabase
    .from('social_platform_connections')
    .select('id, organization_id, auto_respond_enabled, settings')
    .eq('page_id', phoneNumberId)
    .eq('platform', 'whatsapp')
    .eq('is_active', true)
    .single();
  
  if (!connection) {
    logger.warn('No active WhatsApp connection found', { phoneNumberId });
    return;
  }
  
  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', connection.organization_id)
    .single();
  
  if (!org) {
    logger.error('Organization not found', { orgId: connection.organization_id });
    return;
  }
  
  // Classify the message
  const classification = await hybridClassify(content, 'whatsapp');
  
  // Store interaction
  const { data: interaction, error } = await supabase
    .from('social_interactions')
    .insert({
      organization_id: connection.organization_id,
      connection_id: connection.id,
      platform: 'whatsapp',
      interaction_type: 'dm',
      platform_message_id: message.id,
      platform_conversation_id: senderId,
      sender_id: senderId,
      sender_name: senderName,
      content,
      media_urls: mediaUrls,
      intent_classification: classification.intent,
      intent_confidence: classification.confidence,
      sentiment_score: classification.sentimentScore,
      sentiment_label: classification.sentiment,
      is_job_related: classification.isJobRelated,
      extracted_entities: classification.extractedEntities,
      requires_response: classification.suggestedAction !== 'ignore',
      requires_human_review: classification.requiresHumanReview,
      review_reason: classification.reviewReason,
      status: 'pending',
      metadata: {
        message_type: message.type,
        context: message.context,
      },
    })
    .select('id')
    .single();
  
  if (error) {
    logger.error('Failed to store WhatsApp interaction', { error: error.message });
    return;
  }
  
  // Record metrics
  await recordInteractionMetrics(connection.organization_id, 'whatsapp', {
    interactionsReceived: 1,
    jobInquiriesReceived: classification.isJobRelated ? 1 : 0,
    sentiment: classification.sentiment,
  });
  
  // Auto-respond if enabled
  if (connection.auto_respond_enabled && classification.suggestedAction === 'auto_respond') {
    await handleAutoResponse(
      interaction.id,
      connection,
      org,
      senderId,
      senderName,
      content,
      classification,
      phoneNumberId
    );
  }
}

async function handleAutoResponse(
  interactionId: string,
  connection: { id: string; organization_id: string },
  org: { id: string; name: string; slug: string },
  recipientId: string,
  senderName: string | undefined,
  content: string,
  classification: Awaited<ReturnType<typeof hybridClassify>>,
  phoneNumberId: string
): Promise<void> {
  const supabase = getServiceClient();
  
  // Generate response
  const responseResult = await generateEngagementResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform: 'whatsapp',
    interactionType: 'dm',
    interactionId,
    content,
    senderName,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
    applyUrl: `https://ats.me/${org.slug}/apply`,
  });
  
  if (!responseResult.success || !responseResult.content) {
    logger.warn('Failed to generate WhatsApp response', { error: responseResult.error });
    return;
  }
  
  // Save response
  const responseId = await saveResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform: 'whatsapp',
    interactionType: 'dm',
    interactionId,
    content,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
  }, responseResult);
  
  if (!responseResult.requiresApproval && responseId) {
    // Send WhatsApp message
    const sent = await sendWhatsAppMessage(phoneNumberId, recipientId, responseResult.content);
    
    if (sent) {
      await supabase
        .from('social_responses')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', responseId);
      
      await supabase
        .from('social_interactions')
        .update({
          auto_responded: true,
          status: 'responded',
          responded_at: new Date().toISOString(),
        })
        .eq('id', interactionId);
      
      await recordInteractionMetrics(org.id, 'whatsapp', { autoResponsesSent: 1 });
      
      logger.info('WhatsApp auto-response sent', { interactionId });
    }
  }
}

// ============= WhatsApp API =============

async function sendWhatsAppMessage(
  phoneNumberId: string,
  recipientId: string,
  text: string,
  options?: {
    previewUrl?: boolean;
    replyToMessageId?: string;
  }
): Promise<boolean> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || Deno.env.get('META_ACCESS_TOKEN');
  
  if (!accessToken) {
    logger.error('WhatsApp access token not configured');
    return false;
  }
  
  try {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientId,
      type: 'text',
      text: {
        preview_url: options?.previewUrl ?? true,
        body: text,
      },
    };
    
    if (options?.replyToMessageId) {
      body.context = { message_id: options.replyToMessageId };
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send WhatsApp message', { error, status: response.status });
      return false;
    }
    
    const result = await response.json();
    logger.debug('WhatsApp message sent', { messageId: result.messages?.[0]?.id });
    return true;
  } catch (error) {
    logger.error('WhatsApp API error', { error: error.message });
    return false;
  }
}

async function sendWhatsAppTemplate(
  phoneNumberId: string,
  recipientId: string,
  templateName: string,
  languageCode: string = 'en',
  components?: unknown[]
): Promise<boolean> {
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN') || Deno.env.get('META_ACCESS_TOKEN');
  
  if (!accessToken) {
    logger.error('WhatsApp access token not configured');
    return false;
  }
  
  try {
    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      to: recipientId,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };
    
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send WhatsApp template', { error, status: response.status });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('WhatsApp template API error', { error: error.message });
    return false;
  }
}

// ============= Status Processing =============

async function processStatus(status: WhatsAppStatus): Promise<void> {
  const supabase = getServiceClient();
  
  // Update response status based on delivery receipt
  if (status.status === 'failed' && status.errors?.length) {
    const errorMessage = status.errors.map(e => `${e.code}: ${e.message}`).join('; ');
    
    await supabase
      .from('social_responses')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('platform_response_id', status.id);
    
    logger.warn('WhatsApp message failed', { messageId: status.id, errors: status.errors });
  }
}

// ============= Main Handler =============

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  
  // Handle webhook verification (GET)
  if (req.method === 'GET') {
    return handleVerification(url);
  }
  
  // Handle webhook events (POST)
  if (req.method === 'POST') {
    try {
      const payload: WhatsAppWebhookPayload = await req.json();
      
      if (payload.object !== 'whatsapp_business_account') {
        return new Response('Invalid object type', { status: 400, headers: corsHeaders });
      }
      
      logger.info('Received WhatsApp webhook', { entries: payload.entry?.length });
      
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;
          
          const { metadata, contacts, messages, statuses } = change.value;
          const phoneNumberId = metadata.phone_number_id;
          
          // Process messages
          if (messages) {
            for (const message of messages) {
              const contact = contacts?.find(c => c.wa_id === message.from);
              await processMessage(message, contact, phoneNumberId);
            }
          }
          
          // Process delivery statuses
          if (statuses) {
            for (const status of statuses) {
              await processStatus(status);
            }
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('WhatsApp webhook error', { error: error.message });
      
      // Return 200 to prevent retries
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
