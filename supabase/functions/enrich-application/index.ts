/**
 * Enrich Application Edge Function
 * 
 * Accepts application IDs and updates missing experience fields.
 * Can be called after voice screening or manual data entry to
 * populate exp, driving_experience_years, cdl_class, driver_type.
 * 
 * POST /functions/v1/enrich-application
 * Body: { application_id: string, fields: { exp?, driving_experience_years?, cdl_class?, driver_type? } }
 *   or: { application_ids: string[] } — to just query which ones need enrichment
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { getServiceClient } from '../_shared/supabase-client.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('enrich-application');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = getServiceClient();
    const body = await req.json();

    // Mode 1: Query which applications need enrichment
    if (body.action === 'list') {
      const limit = body.limit || 50;
      const clientId = body.client_id;

      let query = supabase
        .from('applications')
        .select('id, first_name, last_name, phone, source, exp, driving_experience_years, cdl_class, driver_type, enrichment_fields, created_at')
        .eq('needs_enrichment', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (clientId) {
        // Filter by client's job listings
        const { data: jobListings } = await supabase
          .from('job_listings')
          .select('id')
          .eq('client_id', clientId);

        if (jobListings?.length) {
          query = query.in('job_listing_id', jobListings.map(j => j.id));
        }
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to query enrichment candidates', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ 
        candidates: data,
        count: data?.length || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mode 2: Enrich a specific application with provided field values
    if (body.application_id && body.fields) {
      const { application_id, fields } = body;

      // Validate fields
      const allowedFields = ['exp', 'driving_experience_years', 'cdl_class', 'driver_type'];
      const updateData: Record<string, unknown> = {};
      const enrichedFields: string[] = [];

      for (const [key, value] of Object.entries(fields)) {
        if (allowedFields.includes(key) && value !== null && value !== undefined && value !== '') {
          updateData[key] = value;
          enrichedFields.push(key);
        }
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch current enrichment_fields to see what's still missing
      const { data: current } = await supabase
        .from('applications')
        .select('enrichment_fields')
        .eq('id', application_id)
        .single();

      const currentMissing = (current?.enrichment_fields as string[]) || [];
      const remainingMissing = currentMissing.filter(f => !enrichedFields.includes(f));

      // If all fields are now populated, clear the enrichment flag
      if (remainingMissing.length === 0) {
        updateData.needs_enrichment = false;
        updateData.enrichment_fields = null;
        updateData.enrichment_status = 'completed';
      } else {
        updateData.enrichment_fields = remainingMissing;
        updateData.enrichment_status = 'partial';
      }

      const { error } = await supabase
        .from('applications')
        .update(updateData)
        .eq('id', application_id);

      if (error) {
        logger.error('Failed to enrich application', error, { application_id });
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      logger.info('Application enriched', { 
        application_id, 
        enrichedFields,
        remainingMissing,
      });

      return new Response(JSON.stringify({ 
        success: true,
        application_id,
        enriched_fields: enrichedFields,
        remaining_fields: remainingMissing,
        fully_enriched: remainingMissing.length === 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid request. Use action=list or provide application_id + fields.',
      usage: {
        list: '{ "action": "list", "client_id": "optional-uuid", "limit": 50 }',
        enrich: '{ "application_id": "uuid", "fields": { "driving_experience_years": 5, "cdl_class": "A" } }',
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    logger.error('Unexpected error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
