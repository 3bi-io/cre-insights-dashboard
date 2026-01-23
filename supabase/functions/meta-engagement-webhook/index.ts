/**
 * Meta Engagement Webhook
 * Handles Facebook and Instagram interactions (comments, DMs, mentions)
 * 
 * Webhook Events:
 * - Page comments on posts
 * - Messenger conversations
 * - Instagram DMs
 * - Instagram comments
 * - Story mentions/replies
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { hybridClassify } from '../_shared/engagement-classifier.ts';
import { generateEngagementResponse, saveResponse } from '../_shared/engagement-responder.ts';
import { recordInteractionMetrics, SocialPlatform } from '../_shared/social-ai-service.ts';

const logger = createLogger('meta-engagement-webhook');

// ============= Types =============

interface MetaWebhookEntry {
  id: string;
  time: number;
  messaging?: MetaMessagingEvent[];
  changes?: MetaChangeEvent[];
}

interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{ type: string; payload: { url: string } }>;
  };
  postback?: {
    payload: string;
    title: string;
  };
}

interface MetaChangeEvent {
  field: string;
  value: {
    item?: string;
    verb?: string;
    comment_id?: string;
    parent_id?: string;
    post_id?: string;
    from?: { id: string; name?: string; username?: string };
    message?: string;
    media?: { id: string };
    media_id?: string;
  };
}

interface MetaWebhookPayload {
  object: 'page' | 'instagram';
  entry: MetaWebhookEntry[];
}

// ============= Webhook Verification =============

function handleVerification(url: URL): Response {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  const verifyToken = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') || 'ats_meta_webhook_2024';
  
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Webhook verification successful');
    return new Response(challenge, { status: 200 });
  }
  
  logger.warn('Webhook verification failed', { mode, tokenMatch: token === verifyToken });
  return new Response('Forbidden', { status: 403 });
}

// ============= Event Processing =============

async function processMessengerEvent(
  event: MetaMessagingEvent,
  pageId: string,
  platform: 'facebook' | 'instagram'
): Promise<void> {
  const supabase = getServiceClient();
  
  if (!event.message?.text) {
    logger.debug('Skipping non-text message', { type: event.message?.attachments?.[0]?.type });
    return;
  }
  
  const senderId = event.sender.id;
  const content = event.message.text;
  const messageId = event.message.mid;
  
  // Find the connection for this page
  const { data: connection } = await supabase
    .from('social_platform_connections')
    .select('id, organization_id, auto_respond_enabled, settings')
    .eq('page_id', pageId)
    .eq('platform', platform)
    .eq('is_active', true)
    .single();
  
  if (!connection) {
    logger.warn('No active connection found for page', { pageId, platform });
    return;
  }
  
  // Get organization details
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
  const classification = await hybridClassify(content, platform);
  
  // Store the interaction
  const { data: interaction, error: insertError } = await supabase
    .from('social_interactions')
    .insert({
      organization_id: connection.organization_id,
      connection_id: connection.id,
      platform,
      interaction_type: 'dm',
      platform_message_id: messageId,
      platform_conversation_id: senderId,
      sender_id: senderId,
      content,
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
    })
    .select('id')
    .single();
  
  if (insertError) {
    logger.error('Failed to store interaction', { error: insertError.message });
    return;
  }
  
  // Record metrics
  await recordInteractionMetrics(connection.organization_id, platform, {
    interactionsReceived: 1,
    jobInquiriesReceived: classification.isJobRelated ? 1 : 0,
    sentiment: classification.sentiment,
  });
  
  // Auto-respond if enabled and appropriate
  if (connection.auto_respond_enabled && classification.suggestedAction === 'auto_respond') {
    await handleAutoResponse(interaction.id, connection, org, platform, content, senderId, classification);
  }
}

async function processCommentEvent(
  change: MetaChangeEvent,
  pageId: string,
  platform: 'facebook' | 'instagram'
): Promise<void> {
  const supabase = getServiceClient();
  
  if (change.value.verb !== 'add' || !change.value.message) {
    return;
  }
  
  const content = change.value.message;
  const commentId = change.value.comment_id;
  const postId = change.value.post_id || change.value.media_id;
  const sender = change.value.from;
  
  if (!sender || !commentId) {
    return;
  }
  
  // Find the connection
  const { data: connection } = await supabase
    .from('social_platform_connections')
    .select('id, organization_id, auto_respond_enabled, settings')
    .eq('page_id', pageId)
    .eq('platform', platform)
    .eq('is_active', true)
    .single();
  
  if (!connection) {
    logger.warn('No active connection found for page', { pageId, platform });
    return;
  }
  
  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', connection.organization_id)
    .single();
  
  if (!org) return;
  
  // Classify
  const classification = await hybridClassify(content, platform);
  
  // Store interaction
  const { data: interaction, error } = await supabase
    .from('social_interactions')
    .insert({
      organization_id: connection.organization_id,
      connection_id: connection.id,
      platform,
      interaction_type: 'comment',
      platform_message_id: commentId,
      post_id: postId,
      sender_id: sender.id,
      sender_name: sender.name,
      sender_handle: sender.username,
      content,
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
    })
    .select('id')
    .single();
  
  if (error) {
    logger.error('Failed to store comment interaction', { error: error.message });
    return;
  }
  
  // Record metrics
  await recordInteractionMetrics(connection.organization_id, platform, {
    interactionsReceived: 1,
    jobInquiriesReceived: classification.isJobRelated ? 1 : 0,
    sentiment: classification.sentiment,
  });
  
  // Auto-respond to comments if enabled
  if (connection.auto_respond_enabled && classification.suggestedAction === 'auto_respond') {
    await handleAutoResponse(interaction.id, connection, org, platform, content, sender.id, classification, {
      commentId,
      postId,
    });
  }
}

async function handleAutoResponse(
  interactionId: string,
  connection: { id: string; organization_id: string; settings: unknown },
  org: { id: string; name: string; slug: string },
  platform: 'facebook' | 'instagram',
  content: string,
  senderId: string,
  classification: Awaited<ReturnType<typeof hybridClassify>>,
  commentContext?: { commentId: string; postId?: string }
): Promise<void> {
  const supabase = getServiceClient();
  
  // Generate response
  const responseResult = await generateEngagementResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform,
    interactionType: commentContext ? 'comment' : 'dm',
    interactionId,
    content,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
    applyUrl: `https://ats.me/${org.slug}/apply`,
  });
  
  if (!responseResult.success || !responseResult.content) {
    logger.warn('Failed to generate response', { error: responseResult.error });
    return;
  }
  
  // Save response
  const responseId = await saveResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform,
    interactionType: commentContext ? 'comment' : 'dm',
    interactionId,
    content,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
  }, responseResult);
  
  if (!responseResult.requiresApproval && responseId) {
    // Send the response via Meta API
    await sendMetaResponse(
      platform,
      senderId,
      responseResult.content,
      commentContext
    );
    
    // Update response as sent
    await supabase
      .from('social_responses')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', responseId);
    
    // Update interaction as responded
    await supabase
      .from('social_interactions')
      .update({ 
        auto_responded: true, 
        status: 'responded',
        responded_at: new Date().toISOString(),
      })
      .eq('id', interactionId);
    
    // Record auto-response metric
    await recordInteractionMetrics(org.id, platform, {
      autoResponsesSent: 1,
    });
    
    logger.info('Auto-response sent', { interactionId, platform });
  }
}

async function sendMetaResponse(
  platform: 'facebook' | 'instagram',
  recipientId: string,
  message: string,
  commentContext?: { commentId: string; postId?: string }
): Promise<boolean> {
  const accessToken = Deno.env.get('META_ACCESS_TOKEN');
  
  if (!accessToken) {
    logger.error('META_ACCESS_TOKEN not configured');
    return false;
  }
  
  try {
    if (commentContext?.commentId) {
      // Reply to comment
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${commentContext.commentId}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            access_token: accessToken,
          }),
        }
      );
      
      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to reply to comment', { error });
        return false;
      }
    } else {
      // Send DM via Messenger/Instagram DM
      const endpoint = platform === 'instagram'
        ? 'https://graph.facebook.com/v18.0/me/messages'
        : 'https://graph.facebook.com/v18.0/me/messages';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: accessToken,
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        logger.error('Failed to send DM', { error, platform });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Meta API error', { error: error.message });
    return false;
  }
}

// ============= Main Handler =============

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  
  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    return handleVerification(url);
  }
  
  // Handle webhook events (POST request)
  if (req.method === 'POST') {
    try {
      const payload: MetaWebhookPayload = await req.json();
      
      logger.info('Received webhook', { 
        object: payload.object, 
        entries: payload.entry?.length 
      });
      
      const platform: SocialPlatform = payload.object === 'instagram' ? 'instagram' : 'facebook';
      
      // Process each entry
      for (const entry of payload.entry || []) {
        const pageId = entry.id;
        
        // Process messaging events (DMs)
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await processMessengerEvent(event, pageId, platform);
          }
        }
        
        // Process change events (comments, mentions)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'feed' || change.field === 'comments') {
              await processCommentEvent(change, pageId, platform);
            }
          }
        }
      }
      
      // Always return 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('Webhook processing error', { error: error.message });
      
      // Still return 200 to prevent Meta from retrying
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
