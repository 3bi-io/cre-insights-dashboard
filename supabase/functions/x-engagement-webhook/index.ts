/**
 * X (Twitter) Engagement Webhook
 * Handles mentions, DMs, and replies on X/Twitter
 * 
 * Note: Uses api.x.com (NOT api.twitter.com)
 * Requires Account Activity API subscription for real-time events
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { createLogger } from '../_shared/logger.ts';
import { hybridClassify } from '../_shared/engagement-classifier.ts';
import { generateEngagementResponse, saveResponse } from '../_shared/engagement-responder.ts';
import { recordInteractionMetrics } from '../_shared/social-ai-service.ts';
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const logger = createLogger('x-engagement-webhook');

// ============= Types =============

interface XWebhookEvent {
  for_user_id: string;
  tweet_create_events?: XTweetEvent[];
  direct_message_events?: XDMEvent[];
  favorite_events?: XFavoriteEvent[];
  follow_events?: XFollowEvent[];
}

interface XTweetEvent {
  id_str: string;
  text: string;
  user: {
    id_str: string;
    name: string;
    screen_name: string;
    profile_image_url_https?: string;
  };
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id_str?: string;
  entities?: {
    user_mentions?: Array<{ id_str: string; screen_name: string }>;
  };
  created_at: string;
}

interface XDMEvent {
  type: string;
  id: string;
  created_timestamp: string;
  message_create: {
    sender_id: string;
    target: { recipient_id: string };
    message_data: {
      text: string;
      entities?: unknown;
    };
  };
}

interface XFavoriteEvent {
  favorited_status: XTweetEvent;
  user: { id_str: string };
}

interface XFollowEvent {
  type: string;
  source: { id: string; screen_name: string };
  target: { id: string; screen_name: string };
}

// ============= OAuth Utilities =============

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');
  
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  const hmac = createHmac('sha1', signingKey);
  hmac.update(signatureBase);
  return btoa(String.fromCharCode(...new Uint8Array(hmac.digest())));
}

function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };
  
  // IMPORTANT: Do NOT include POST body params in signature for Twitter API
  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    accessTokenSecret
  );
  
  oauthParams.oauth_signature = signature;
  
  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');
  
  return `OAuth ${headerParts}`;
}

// ============= CRC Token Verification =============

function handleCRCChallenge(crcToken: string): Response {
  const consumerSecret = Deno.env.get('TWITTER_CONSUMER_SECRET');
  
  if (!consumerSecret) {
    logger.error('TWITTER_CONSUMER_SECRET not configured');
    return new Response('Server configuration error', { status: 500 });
  }
  
  const hmac = createHmac('sha256', consumerSecret);
  hmac.update(crcToken);
  const responseToken = btoa(String.fromCharCode(...new Uint8Array(hmac.digest())));
  
  return new Response(
    JSON.stringify({ response_token: `sha256=${responseToken}` }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// ============= Event Processing =============

async function processTweetMention(
  tweet: XTweetEvent,
  forUserId: string
): Promise<void> {
  const supabase = getServiceClient();
  
  // Skip if this is our own tweet
  if (tweet.user.id_str === forUserId) {
    return;
  }
  
  // Find connection for this X account
  const { data: connection } = await supabase
    .from('social_platform_connections')
    .select('id, organization_id, auto_respond_enabled, settings')
    .eq('platform_user_id', forUserId)
    .eq('platform', 'twitter')
    .eq('is_active', true)
    .single();
  
  if (!connection) {
    logger.warn('No active X connection found', { forUserId });
    return;
  }
  
  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', connection.organization_id)
    .single();
  
  if (!org) return;
  
  const content = tweet.text;
  const isReply = !!tweet.in_reply_to_status_id_str;
  
  // Classify the tweet
  const classification = await hybridClassify(content, 'twitter');
  
  // Store interaction
  const { data: interaction, error } = await supabase
    .from('social_interactions')
    .insert({
      organization_id: connection.organization_id,
      connection_id: connection.id,
      platform: 'twitter',
      interaction_type: isReply ? 'reply' : 'mention',
      platform_message_id: tweet.id_str,
      sender_id: tweet.user.id_str,
      sender_name: tweet.user.name,
      sender_handle: tweet.user.screen_name,
      sender_avatar_url: tweet.user.profile_image_url_https,
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
      metadata: {
        in_reply_to_status_id: tweet.in_reply_to_status_id_str,
        in_reply_to_user_id: tweet.in_reply_to_user_id_str,
      },
    })
    .select('id')
    .single();
  
  if (error) {
    logger.error('Failed to store tweet interaction', { error: error.message });
    return;
  }
  
  // Record metrics
  await recordInteractionMetrics(connection.organization_id, 'twitter', {
    interactionsReceived: 1,
    jobInquiriesReceived: classification.isJobRelated ? 1 : 0,
    sentiment: classification.sentiment,
  });
  
  // Auto-respond if enabled
  if (connection.auto_respond_enabled && classification.suggestedAction === 'auto_respond') {
    await handleXAutoResponse(
      interaction.id,
      connection,
      org,
      tweet,
      classification
    );
  }
}

async function processDM(
  dm: XDMEvent,
  forUserId: string
): Promise<void> {
  const supabase = getServiceClient();
  
  const senderId = dm.message_create.sender_id;
  
  // Skip if this is our own message
  if (senderId === forUserId) {
    return;
  }
  
  // Find connection
  const { data: connection } = await supabase
    .from('social_platform_connections')
    .select('id, organization_id, auto_respond_enabled, settings')
    .eq('platform_user_id', forUserId)
    .eq('platform', 'twitter')
    .eq('is_active', true)
    .single();
  
  if (!connection) {
    logger.warn('No active X connection for DM', { forUserId });
    return;
  }
  
  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', connection.organization_id)
    .single();
  
  if (!org) return;
  
  const content = dm.message_create.message_data.text;
  
  // Classify
  const classification = await hybridClassify(content, 'twitter');
  
  // Store interaction
  const { data: interaction, error } = await supabase
    .from('social_interactions')
    .insert({
      organization_id: connection.organization_id,
      connection_id: connection.id,
      platform: 'twitter',
      interaction_type: 'dm',
      platform_message_id: dm.id,
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
  
  if (error) {
    logger.error('Failed to store DM interaction', { error: error.message });
    return;
  }
  
  // Record metrics
  await recordInteractionMetrics(connection.organization_id, 'twitter', {
    interactionsReceived: 1,
    jobInquiriesReceived: classification.isJobRelated ? 1 : 0,
    sentiment: classification.sentiment,
  });
  
  // Auto-respond if enabled
  if (connection.auto_respond_enabled && classification.suggestedAction === 'auto_respond') {
    await handleXDMAutoResponse(
      interaction.id,
      connection,
      org,
      senderId,
      content,
      classification
    );
  }
}

async function handleXAutoResponse(
  interactionId: string,
  connection: { id: string; organization_id: string },
  org: { id: string; name: string; slug: string },
  tweet: XTweetEvent,
  classification: Awaited<ReturnType<typeof hybridClassify>>
): Promise<void> {
  const supabase = getServiceClient();
  
  // Generate response
  const responseResult = await generateEngagementResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform: 'twitter',
    interactionType: 'mention',
    interactionId,
    content: tweet.text,
    senderName: tweet.user.name,
    senderHandle: tweet.user.screen_name,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
    applyUrl: `https://apply.jobs/${org.slug}/apply`,
  });
  
  if (!responseResult.success || !responseResult.content) {
    logger.warn('Failed to generate X response', { error: responseResult.error });
    return;
  }
  
  // Save response
  const responseId = await saveResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform: 'twitter',
    interactionType: 'mention',
    interactionId,
    content: tweet.text,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
  }, responseResult);
  
  if (!responseResult.requiresApproval && responseId) {
    // Reply to the tweet
    const replyText = `@${tweet.user.screen_name} ${responseResult.content}`;
    const sent = await sendTweetReply(replyText, tweet.id_str);
    
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
      
      await recordInteractionMetrics(org.id, 'twitter', { autoResponsesSent: 1 });
      
      logger.info('X auto-reply sent', { interactionId });
    }
  }
}

async function handleXDMAutoResponse(
  interactionId: string,
  connection: { id: string; organization_id: string },
  org: { id: string; name: string; slug: string },
  recipientId: string,
  content: string,
  classification: Awaited<ReturnType<typeof hybridClassify>>
): Promise<void> {
  const supabase = getServiceClient();
  
  // Generate response
  const responseResult = await generateEngagementResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform: 'twitter',
    interactionType: 'dm',
    interactionId,
    content,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
    applyUrl: `https://apply.jobs/${org.slug}/apply`,
  });
  
  if (!responseResult.success || !responseResult.content) {
    return;
  }
  
  // Save response
  const responseId = await saveResponse({
    organizationId: org.id,
    organizationName: org.name,
    platform: 'twitter',
    interactionType: 'dm',
    interactionId,
    content,
    intent: classification.intent,
    sentiment: classification.sentiment,
    extractedEntities: classification.extractedEntities,
  }, responseResult);
  
  if (!responseResult.requiresApproval && responseId) {
    const sent = await sendDirectMessage(recipientId, responseResult.content);
    
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
      
      await recordInteractionMetrics(org.id, 'twitter', { autoResponsesSent: 1 });
      
      logger.info('X DM auto-response sent', { interactionId });
    }
  }
}

// ============= X API Calls =============

async function sendTweetReply(text: string, inReplyToId: string): Promise<boolean> {
  const consumerKey = Deno.env.get('TWITTER_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('TWITTER_CONSUMER_SECRET');
  const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
  const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');
  
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    logger.error('X API credentials not configured');
    return false;
  }
  
  const url = 'https://api.x.com/2/tweets';
  
  try {
    const authHeader = buildOAuthHeader(
      'POST',
      url,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        reply: { in_reply_to_tweet_id: inReplyToId },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send tweet reply', { error, status: response.status });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('X API error', { error: error.message });
    return false;
  }
}

async function sendDirectMessage(recipientId: string, text: string): Promise<boolean> {
  const consumerKey = Deno.env.get('TWITTER_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('TWITTER_CONSUMER_SECRET');
  const accessToken = Deno.env.get('TWITTER_ACCESS_TOKEN');
  const accessTokenSecret = Deno.env.get('TWITTER_ACCESS_TOKEN_SECRET');
  
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    logger.error('X API credentials not configured');
    return false;
  }
  
  const url = 'https://api.x.com/2/dm_conversations/with/' + recipientId + '/messages';
  
  try {
    const authHeader = buildOAuthHeader(
      'POST',
      url,
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret
    );
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      logger.error('Failed to send DM', { error, status: response.status });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('X DM API error', { error: error.message });
    return false;
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
  
  // Handle CRC challenge (GET request)
  if (req.method === 'GET') {
    const crcToken = url.searchParams.get('crc_token');
    if (crcToken) {
      return handleCRCChallenge(crcToken);
    }
    return new Response('OK', { status: 200 });
  }
  
  // Handle webhook events (POST request)
  if (req.method === 'POST') {
    try {
      const payload: XWebhookEvent = await req.json();
      const forUserId = payload.for_user_id;
      
      logger.info('Received X webhook', {
        forUserId,
        hasTweets: !!payload.tweet_create_events?.length,
        hasDMs: !!payload.direct_message_events?.length,
      });
      
      // Process tweet mentions
      if (payload.tweet_create_events) {
        for (const tweet of payload.tweet_create_events) {
          await processTweetMention(tweet, forUserId);
        }
      }
      
      // Process DMs
      if (payload.direct_message_events) {
        for (const dm of payload.direct_message_events) {
          if (dm.type === 'message_create') {
            await processDM(dm, forUserId);
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('X webhook processing error', { error: error.message });
      
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
