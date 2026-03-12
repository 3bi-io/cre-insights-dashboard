/**
 * Calendar Invite Connect Page
 * Public landing page for recruiters who receive a calendar invite email.
 * Validates the token and initiates the Nylas OAuth flow.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, CheckCircle2, XCircle, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PageStatus = 'loading' | 'ready' | 'connecting' | 'error' | 'completed';

const CalendarInviteConnect = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [orgName, setOrgName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No invitation token provided. Please check your email link.');
      return;
    }

    // Validate the token
    const validateToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calendar-integration', {
          body: { action: 'redeem_calendar_invite', token },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || 'Invalid invitation');

        setOrgName(data.organization_name || 'Organization');
        setRecruiterEmail(data.recruiter_email || '');
        // Don't redirect yet — just show the ready state
        setStatus('ready');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'This invitation is invalid or has expired.');
      }
    };

    validateToken();
  }, [token]);

  const handleConnect = async () => {
    setStatus('connecting');
    try {
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'redeem_calendar_invite', token },
      });

      if (error) throw error;
      if (!data?.success || !data?.url) throw new Error(data?.error || 'Failed to generate authorization URL');

      // Redirect to Nylas OAuth
      window.location.href = data.url;
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to start calendar connection.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'ready' && <Calendar className="h-6 w-6 text-primary" />}
            {status === 'connecting' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            {status === 'completed' && <CheckCircle2 className="h-6 w-6 text-green-600" />}
            Connect Your Calendar
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Verifying your invitation...'}
            {status === 'ready' && `${orgName} has invited you to connect your calendar`}
            {status === 'connecting' && 'Redirecting to calendar authorization...'}
            {status === 'error' && 'Unable to process this invitation'}
            {status === 'completed' && 'Your calendar has been connected!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {status === 'ready' && (
            <>
              {recruiterEmail && (
                <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{recruiterEmail}</p>
                    <p className="text-xs text-muted-foreground">Invitation sent to this email</p>
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                By connecting your calendar, <strong>{orgName}</strong>'s AI scheduling agent will be able to check your availability and book driver callbacks on your behalf.
              </p>

              <Button onClick={handleConnect} className="w-full" size="lg">
                <Calendar className="h-4 w-4 mr-2" />
                Connect Calendar
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You'll be redirected to authorize access to your calendar. We only check availability and create events — we never read your email.
              </p>
            </>
          )}

          {status === 'connecting' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Redirecting to calendar authorization...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <p className="text-xs text-muted-foreground">
                If you believe this is an error, please contact your administrator to resend the invitation.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarInviteConnect;
