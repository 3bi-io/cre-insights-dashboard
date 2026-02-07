/**
 * Hayes Danny Herman Trucking Inbound Endpoint
 * 
 * Client-specific endpoint for Danny Herman Trucking:
 * - Job sync: GET /functions/v1/hayes-danny-herman-inbound?action=jobs
 * - Application: POST /functions/v1/hayes-danny-herman-inbound
 * 
 * All jobs and applications are automatically routed to Danny Herman Trucking
 * with client-specific UTM tracking (utm_campaign=danny-herman).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler(HAYES_CLIENT_CONFIGS['danny-herman']);

serve(handler);
