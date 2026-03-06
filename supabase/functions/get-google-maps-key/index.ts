import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors-config.ts';
import { verifyUser } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  // Require authentication
  try {
    await verifyUser(req);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Google Maps API key not configured' }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ apiKey }),
    { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
  );
});
