/**
 * Hayes James Burg Trucking Inbound Endpoint
 * 
 * Client-specific endpoint for James Burg Trucking Company:
 * - Job sync: GET /functions/v1/hayes-jamesburg-inbound?action=jobs
 * - Application: POST /functions/v1/hayes-jamesburg-inbound
 * 
 * All jobs and applications are automatically routed to James Burg Trucking Company
 * with client-specific UTM tracking (utm_campaign=james-burg).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler(HAYES_CLIENT_CONFIGS['james-burg']);

serve(handler);
