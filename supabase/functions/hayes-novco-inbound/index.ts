/**
 * Hayes Novco, Inc. Inbound Endpoint
 * 
 * Client-specific endpoint for Novco, Inc.:
 * - Job sync: GET /functions/v1/hayes-novco-inbound?action=jobs
 * - Application: POST /functions/v1/hayes-novco-inbound
 * 
 * All jobs and applications are automatically routed to Novco, Inc.
 * with client-specific UTM tracking (utm_campaign=novco).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler(HAYES_CLIENT_CONFIGS['novco']);

serve(handler);
