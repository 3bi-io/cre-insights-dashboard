/**
 * Nylas OAuth Callback Page
 * Handles the redirect from Nylas after calendar authorization
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type CallbackStatus = 'processing' | 'success' | 'error';

const KNOWN_ERROR_HINTS: Record<string, string> = {
  '31004': 'This usually means the Nylas API region or Client ID is misconfigured. Verify that NYLAS_API_BASE matches your Nylas app region (US vs EU) and that NYLAS_CLIENT_ID is correct.',
  'integration_not_found': 'The Nylas integration was not found. Check that your Nylas Client ID and API Key belong to the same application.',
  'invalid_redirect_uri': 'The redirect URI does not match what is configured in Nylas. Ensure NYLAS_REDIRECT_URI matches exactly.',
};

function getErrorHint(error: string, description: string): string | null {
  const combined = `${error} ${description}`.toLowerCase();
  for (const [key, hint] of Object.entries(KNOWN_ERROR_HINTS)) {
    if (combined.includes(key.toLowerCase())) return hint;
  }
  return null;
}

const CalendarCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('processing');
  const [message, setMessage] = useState('Connecting your calendar...');
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description') || '';

    if (error) {
      const displayMsg = errorDescription
        ? `Authorization failed: ${error} — ${errorDescription}`
        : `Authorization failed: ${error}`;
      setStatus('error');
      setMessage(displayMsg);
      setHint(getErrorHint(error, errorDescription));
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setMessage('Missing authorization parameters. Please try connecting again.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('calendar-integration', {
          body: { action: 'oauth_callback', code, state },
        });

        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || 'Unknown error');

        setStatus('success');
        setMessage(`Calendar connected: ${data.email}`);
      } catch (err: any) {
        console.error('Calendar callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to connect calendar. Please try again.');
      }
    };

    exchangeCode();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            Calendar Connection
          </CardTitle>
          <CardDescription>
            {status === 'processing' && 'Please wait while we connect your calendar...'}
            {status === 'success' && 'Your calendar has been connected successfully!'}
            {status === 'error' && 'There was a problem connecting your calendar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          
          {hint && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-left">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
          )}
          
          {status !== 'processing' && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate('/admin/elevenlabs-admin')} variant="default">
                Go to Admin
              </Button>
              {status === 'error' && (
                <Button onClick={() => window.close()} variant="outline">
                  Close
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarCallback;
