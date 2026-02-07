/**
 * Hayes Day and Ross Inbound Endpoint
 * 
 * Client-specific endpoint for Day and Ross:
 * - Job sync: GET /functions/v1/hayes-dayross-inbound?action=jobs
 * - Application: POST /functions/v1/hayes-dayross-inbound
 * 
 * All jobs and applications are automatically routed to Day and Ross
 * with client-specific UTM tracking (utm_campaign=dayross).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler(HAYES_CLIENT_CONFIGS['dayross']);

serve(handler);
