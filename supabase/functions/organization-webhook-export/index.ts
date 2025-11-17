import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { application_ids, filters } = await req.json();

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get organization webhook configuration
    const { data: webhookConfig, error: webhookError } = await supabase
      .from('organization_webhooks')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('enabled', true)
      .single();

    if (webhookError || !webhookConfig) {
      return new Response(
        JSON.stringify({ error: 'No webhook configured for organization' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch applications data
    let query = supabase
      .from('applications')
      .select(`
        *,
        job_listings!inner(
          id,
          title,
          location,
          organization_id
        )
      `)
      .eq('job_listings.organization_id', profile.organization_id);

    // Apply filters if provided
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.source && filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,applicant_email.ilike.%${filters.search}%`);
      }
    }

    // If specific IDs provided, use those
    if (application_ids && application_ids.length > 0) {
      query = query.in('id', application_ids);
    }

    const { data: applications, error: appError } = await query;

    if (appError) {
      console.error('Error fetching applications:', appError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch applications' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare payload for n8n
    const payload = {
      organization_id: profile.organization_id,
      export_timestamp: new Date().toISOString(),
      total_applications: applications?.length || 0,
      filters: filters || {},
      applications: applications || []
    };

    // Send to n8n webhook
    const webhookHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add signature if secret key is configured
    if (webhookConfig.secret_key) {
      webhookHeaders['X-Webhook-Signature'] = webhookConfig.secret_key;
    }

    const webhookResponse = await fetch(webhookConfig.webhook_url, {
      method: 'POST',
      headers: webhookHeaders,
      body: JSON.stringify(payload),
    });

    const webhookResponseText = await webhookResponse.text();

    // Update webhook status
    await supabase
      .from('organization_webhooks')
      .update({
        last_triggered_at: new Date().toISOString(),
        last_success_at: webhookResponse.ok ? new Date().toISOString() : null,
        last_error: webhookResponse.ok ? null : `Status ${webhookResponse.status}: ${webhookResponseText}`,
      })
      .eq('id', webhookConfig.id);

    if (!webhookResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'Webhook delivery failed',
          status: webhookResponse.status,
          response: webhookResponseText,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        applications_sent: applications?.length || 0,
        webhook_status: webhookResponse.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in organization-webhook-export:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
