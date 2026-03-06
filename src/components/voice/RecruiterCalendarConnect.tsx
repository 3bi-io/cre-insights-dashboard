/**
 * RecruiterCalendarConnect
 * UI for recruiters to connect/disconnect their Google/Outlook calendar via Nylas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Link2, Unlink, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarConnection {
  id: string;
  email: string;
  provider_type: string;
  status: string;
  connected_at: string;
  calendar_id: string | null;
}

export function RecruiterCalendarConnect() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'list_connections' },
      });
      if (error) throw error;
      setConnections(data?.connections || []);
    } catch (err: any) {
      console.error('Failed to fetch calendar connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'oauth_url' },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank', 'width=600,height=700');
        toast({
          title: 'Calendar Connection',
          description: 'Complete the authorization in the popup window, then refresh this page.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Connection Failed',
        description: err.message || 'Failed to start calendar connection',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingId(connectionId);
    try {
      const { error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'disconnect', connectionId },
      });
      if (error) throw error;
      setConnections(prev => prev.filter(c => c.id !== connectionId));
      toast({ title: 'Disconnected', description: 'Calendar connection removed.' });
    } catch (err: any) {
      toast({
        title: 'Disconnect Failed',
        description: err.message || 'Failed to disconnect calendar',
        variant: 'destructive',
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  const activeConnections = connections.filter(c => c.status === 'active');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Calendar Integration</CardTitle>
          </div>
          {activeConnections.length > 0 && (
            <Badge variant="default" className="bg-green-600">Connected</Badge>
          )}
        </div>
        <CardDescription>
          Connect your Google or Outlook calendar so AI agents can check your availability and schedule driver callbacks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading connections...
          </div>
        ) : activeConnections.length > 0 ? (
          <div className="space-y-3">
            {activeConnections.map(conn => (
              <div
                key={conn.id}
                className="flex items-center justify-between rounded-lg border p-3 bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Link2 className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{conn.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {conn.provider_type || 'Calendar'} · Connected {new Date(conn.connected_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDisconnect(conn.id)}
                  disabled={disconnectingId === conn.id}
                >
                  {disconnectingId === conn.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              No calendar connected. Connect your calendar to enable AI-scheduled callbacks.
            </p>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Calendar
                </>
              )}
            </Button>
          </div>
        )}

        {activeConnections.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            Reconnect / Change Calendar
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchConnections}
          className="w-full"
        >
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
