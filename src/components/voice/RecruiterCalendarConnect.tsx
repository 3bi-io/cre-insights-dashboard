/**
 * RecruiterCalendarConnect
 * Client-centric calendar management for admins.
 * Allows connecting recruiter calendars per client so the AI agent
 * can schedule callbacks based on client-specific recruiter availability.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Link2, Unlink, Loader2, ExternalLink, RefreshCw, Users, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CalendarConnection {
  id: string;
  user_id: string;
  email: string;
  provider_type: string;
  status: string;
  connected_at: string;
  calendar_id: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
}

export function RecruiterCalendarConnect() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch clients for the selector
  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      setClients(data || []);
    };
    fetchClients();
  }, []);

  // Fetch connections when client changes
  useEffect(() => {
    fetchConnections();
  }, [selectedClientId]);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const body: Record<string, any> = {
        action: 'list_connections',
        include_org: true,
      };
      if (selectedClientId !== 'all' && selectedClientId !== 'org-level') {
        body.client_id = selectedClientId;
      }

      const { data, error } = await supabase.functions.invoke('calendar-integration', { body });
      if (error) throw error;

      let conns: CalendarConnection[] = data?.connections || [];
      
      // Filter by view
      if (selectedClientId === 'org-level') {
        conns = conns.filter(c => !c.client_id);
      } else if (selectedClientId !== 'all') {
        conns = conns.filter(c => c.client_id === selectedClientId);
      }

      setConnections(conns);
    } catch (err: any) {
      console.error('Failed to fetch calendar connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (clientId?: string) => {
    setIsConnecting(true);
    try {
      const body: Record<string, any> = { action: 'oauth_url' };
      if (clientId && clientId !== 'all' && clientId !== 'org-level') {
        body.client_id = clientId;
      }

      const { data, error } = await supabase.functions.invoke('calendar-integration', { body });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank', 'width=600,height=700');
        toast({
          title: 'Calendar Connection',
          description: 'Complete the authorization in the popup window, then click Refresh.',
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
  const clientName = selectedClientId === 'all' 
    ? 'All' 
    : selectedClientId === 'org-level'
    ? 'Organization-Level'
    : clients.find(c => c.id === selectedClientId)?.name || 'Selected Client';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Calendar Integration</CardTitle>
          </div>
          {activeConnections.length > 0 && (
            <Badge variant="default" className="bg-green-600">
              {activeConnections.length} Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect recruiter calendars per client so the AI agent can check availability and schedule driver callbacks.
          Each client can have multiple recruiter calendars for round-robin scheduling.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Client Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Filter by Client
          </label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Connections</SelectItem>
              <SelectItem value="org-level">Organization-Level (No Client)</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Connections List */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{conn.provider_type || 'Calendar'}</span>
                      <span>·</span>
                      <span>Connected {new Date(conn.connected_at).toLocaleDateString()}</span>
                      {conn.client_id && (
                        <>
                          <span>·</span>
                          <Badge variant="outline" className="text-xs py-0">
                            {clients.find(c => c.id === conn.client_id)?.name || 'Client'}
                          </Badge>
                        </>
                      )}
                      {!conn.client_id && (
                        <>
                          <span>·</span>
                          <Badge variant="secondary" className="text-xs py-0">Org-Level</Badge>
                        </>
                      )}
                    </div>
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
              No calendar connections{selectedClientId !== 'all' ? ` for ${clientName}` : ''}. 
              Connect a recruiter calendar to enable AI-scheduled callbacks.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleConnect(selectedClientId !== 'all' && selectedClientId !== 'org-level' ? selectedClientId : undefined)}
            disabled={isConnecting}
            variant={activeConnections.length > 0 ? 'outline' : 'default'}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                {activeConnections.length > 0 ? 'Add Another Calendar' : 'Connect Calendar'}
                {selectedClientId !== 'all' && selectedClientId !== 'org-level' && (
                  <span className="ml-1 text-xs opacity-70">for {clientName}</span>
                )}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchConnections}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Help text */}
        {clients.length > 0 && (
          <p className="text-xs text-muted-foreground border-t pt-3">
            <Users className="h-3 w-3 inline mr-1" />
            Select a client above, then connect a calendar. The AI will use client-specific calendars first, 
            falling back to org-level connections if none are set for a client.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
