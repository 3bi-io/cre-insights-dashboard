/**
 * Hayes Harpers Hotshot Inbound Endpoint
 *
 * Client-specific endpoint for Harpers Hotshot:
 * - Job sync: GET /functions/v1/hayes-harpers-hotshot-inbound?action=jobs
 * - Application: POST /functions/v1/hayes-harpers-hotshot-inbound
 *
 * All jobs and applications are automatically routed to Harpers Hotshot
 * with client-specific UTM tracking (utm_campaign=harpers-hotshot).
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClientHandler, HAYES_CLIENT_CONFIGS } from '../_shared/hayes-client-handler.ts';

const handler = createClientHandler(HAYES_CLIENT_CONFIGS['harpers-hotshot']);

serve(handler);
