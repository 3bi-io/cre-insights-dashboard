import { createClient } from 'npm:@supabase/supabase-js@2.50.0';
import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors-config.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('launch-social-beacons');

interface LaunchResult {
  creativeId: string;
  platform: string;
  status: 'launched' | 'failed' | 'skipped';
  error?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightIfNeeded(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');
  const headers = { ...getCorsHeaders(origin), 'Content-Type': 'application/json' };

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    const supabaseAdmin = getServiceClient();
    const supabaseUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers });
    }

    const userId = claimsData.claims.sub as string;

    const { data: roles } = await supabaseAdmin
      .from('user_roles').select('role').eq('user_id', userId);

    const userRoles = roles?.map((r: { role: string }) => r.role) || [];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('email, organization_id').eq('id', userId).single();

    const isSuperByEmail = profile?.email === 'c@3bi.io';

    if (!isAdmin && !isSuperByEmail) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers });
    }

    const organizationId = profile?.organization_id;

    let creativesQuery = supabaseAdmin
      .from('generated_ad_creatives').select('*').in('status', ['draft', 'ready', 'queued']);
    if (organizationId) creativesQuery = creativesQuery.eq('organization_id', organizationId);

    const { data: creatives, error: creativesError } = await creativesQuery;
    if (creativesError) throw creativesError;

    if (!creatives || creatives.length === 0) {
      return new Response(JSON.stringify({
        success: true, launched: 0, failed: 0, skipped: 0, details: [],
        message: 'No unpublished creatives found',
      }), { status: 200, headers });
    }

    let connectionsQuery = supabaseAdmin
      .from('social_platform_connections').select('*').eq('is_active', true);
    if (organizationId) connectionsQuery = connectionsQuery.eq('organization_id', organizationId);

    const { data: connections, error: connectionsError } = await connectionsQuery;
    if (connectionsError) throw connectionsError;

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({
        success: true, launched: 0, failed: 0, skipped: creatives.length, details: [],
        message: 'No active platform connections found',
      }), { status: 200, headers });
    }

    const results: LaunchResult[] = [];
    let launched = 0;
    let failed = 0;
    let skipped = 0;

    // deno-lint-ignore no-explicit-any
    for (const creative of creatives as any[]) {
      const alreadyPublished = creative.platforms_published || [];

      // deno-lint-ignore no-explicit-any
      for (const connection of connections as any[]) {
        const platform = connection.platform;

        if (alreadyPublished.includes(platform)) {
          skipped++;
          results.push({ creativeId: creative.id, platform, status: 'skipped' });
          continue;
        }

        try {
          let postSuccess = false;
          const accessToken = connection.access_token;
          const content = `${creative.headline}\n\n${creative.body}\n\n${(creative.hashtags || []).map((h: string) => `#${h}`).join(' ')}`;

          switch (platform) {
            case 'facebook': {
              const pageId = connection.platform_user_id;
              if (pageId && accessToken) {
                const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    message: content, access_token: accessToken,
                    ...(creative.media_url ? { link: creative.media_url } : {}),
                  }),
                });
                const fbBody = await fbResponse.text();
                postSuccess = fbResponse.ok;
                if (!postSuccess) throw new Error(`Facebook API error: ${fbBody}`);
              } else {
                throw new Error('Missing Facebook page ID or access token');
              }
              break;
            }
            case 'instagram': {
              const igUserId = connection.platform_user_id;
              if (igUserId && accessToken && creative.media_url) {
                const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image_url: creative.media_url, caption: content, access_token: accessToken }),
                });
                const containerData = await containerRes.json();
                if (!containerRes.ok) throw new Error(`IG container error: ${JSON.stringify(containerData)}`);
                const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
                });
                const publishBody = await publishRes.text();
                postSuccess = publishRes.ok;
                if (!postSuccess) throw new Error(`IG publish error: ${publishBody}`);
              } else {
                throw new Error('Missing Instagram user ID, token, or media URL');
              }
              break;
            }
            case 'x': {
              if (accessToken) {
                const tweetRes = await fetch('https://api.twitter.com/2/tweets', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                  body: JSON.stringify({ text: content.substring(0, 280) }),
                });
                const tweetBody = await tweetRes.text();
                postSuccess = tweetRes.ok;
                if (!postSuccess) throw new Error(`X API error: ${tweetBody}`);
              } else {
                throw new Error('Missing X access token');
              }
              break;
            }
            case 'linkedin': {
              const linkedinUserId = connection.platform_user_id;
              if (linkedinUserId && accessToken) {
                const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' },
                  body: JSON.stringify({
                    author: `urn:li:person:${linkedinUserId}`,
                    lifecycleState: 'PUBLISHED',
                    specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: content }, shareMediaCategory: 'NONE' } },
                    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
                  }),
                });
                const liBody = await liRes.text();
                postSuccess = liRes.ok;
                if (!postSuccess) throw new Error(`LinkedIn API error: ${liBody}`);
              } else {
                throw new Error('Missing LinkedIn user ID or access token');
              }
              break;
            }
            case 'tiktok':
            case 'reddit': {
              skipped++;
              results.push({ creativeId: creative.id, platform, status: 'skipped', error: `${platform} direct posting not yet supported` });
              continue;
            }
            default:
              skipped++;
              results.push({ creativeId: creative.id, platform, status: 'skipped', error: `Unknown platform: ${platform}` });
              continue;
          }

          if (postSuccess) {
            const updatedPlatforms = [...alreadyPublished, platform];
            await supabaseAdmin.from('generated_ad_creatives').update({
              platforms_published: updatedPlatforms, published_at: new Date().toISOString(), status: 'published',
            }).eq('id', creative.id);
            launched++;
            results.push({ creativeId: creative.id, platform, status: 'launched' });
          }
        } catch (err: unknown) {
          failed++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          logger.error(`Failed to publish creative ${creative.id} to ${platform}`, err);
          results.push({ creativeId: creative.id, platform, status: 'failed', error: errorMsg });
          await supabaseAdmin.from('generated_ad_creatives').update({ status: 'failed' }).eq('id', creative.id);
        }
      }
    }

    await supabaseAdmin.from('audit_logs').insert({
      user_id: userId, organization_id: organizationId,
      table_name: 'generated_ad_creatives',
      action: `ROCKET_LAUNCH: ${launched} launched, ${failed} failed, ${skipped} skipped`,
      sensitive_fields: ['social_platform_tokens'],
    });

    return new Response(JSON.stringify({
      success: true, launched, failed, skipped, details: results,
      message: `🚀 Launch complete: ${launched} published, ${failed} failed, ${skipped} skipped`,
    }), { status: 200, headers });

  } catch (error: unknown) {
    logger.error('Launch error', error);
    return new Response(JSON.stringify({
      success: false, error: error instanceof Error ? error.message : 'Internal server error',
    }), { status: 500, headers });
  }
});
