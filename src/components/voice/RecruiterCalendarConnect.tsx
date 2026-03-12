/**
 * RecruiterCalendarConnect
 * Client-centric calendar management for admins.
 * Allows connecting recruiter calendars per client so the AI agent
 * can schedule callbacks based on client-specific recruiter availability.
 * Includes "Invite by Email" flow for external recruiters.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Link2, Unlink, Loader2, ExternalLink, RefreshCw, Users, Building2, HeartPulse, CheckCircle2, XCircle, Mail, Send, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/shared/ResponsiveDialog';

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

interface Invitation {
  id: string;
  recruiter_email: string;
  client_id: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  completed_at: string | null;
}

export function RecruiterCalendarConnect() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { healthy: boolean; error?: string }>>({});
  
  // Invite dialog state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  
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
    fetchInvitations();
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

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'list_invitations' },
      });
      if (error) throw error;
      setInvitations(data?.invitations || []);
    } catch {
      // Silent fail — invitations are supplementary
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

  const handleTestConnection = async (connectionId: string) => {
    setTestingId(connectionId);
    try {
      const { data, error } = await supabase.functions.invoke('calendar-integration', {
        body: { action: 'test_connection', connectionId },
      });
      if (error) throw error;
      setTestResults(prev => ({
        ...prev,
        [connectionId]: { healthy: data?.healthy ?? false, error: data?.error },
      }));
      toast({
        title: data?.healthy ? 'Connection Healthy' : 'Connection Issue',
        description: data?.healthy ? `Calendar for ${data.email} is active.` : (data?.error || 'Grant may be expired'),
        variant: data?.healthy ? 'default' : 'destructive',
      });
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [connectionId]: { healthy: false, error: err.message },
      }));
      toast({ title: 'Test Failed', description: err.message, variant: 'destructive' });
    } finally {
      setTestingId(null);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    setIsSendingInvite(true);
    try {
      const body: Record<string, any> = {
        action: 'send_calendar_invite',
        recruiter_email: inviteEmail.trim(),
      };
      if (selectedClientId !== 'all' && selectedClientId !== 'org-level') {
        body.client_id = selectedClientId;
      }

      const { data, error } = await supabase.functions.invoke('calendar-integration', { body });
      if (error) throw error;

      if (data?.emailSent) {
        toast({
          title: 'Invitation Sent',
          description: `Calendar invite email sent to ${inviteEmail.trim()}`,
        });
      } else {
        toast({
          title: 'Invitation Created',
          description: data?.message || 'Invitation created but email may not have been sent.',
          variant: 'default',
        });
      }

      setInviteEmail('');
      setShowInviteDialog(false);
      fetchInvitations();
    } catch (err: any) {
      toast({
        title: 'Invite Failed',
        description: err.message || 'Failed to send calendar invite',
        variant: 'destructive',
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const activeConnections = connections.filter(c => c.status === 'active');
  const pendingInvitations = invitations.filter(i => i.status === 'pending' && new Date(i.expires_at) > new Date());
  const clientName = selectedClientId === 'all' 
    ? 'All' 
    : selectedClientId === 'org-level'
    ? 'Organization-Level'
    : clients.find(c => c.id === selectedClientId)?.name || 'Selected Client';

  return (
    <>
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
                  <div className="flex items-center gap-1">
                    {testResults[conn.id] && (
                      testResults[conn.id].healthy ? (
                        <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3" /> Healthy
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive">
                          <XCircle className="h-3 w-3" /> Unhealthy
                        </Badge>
                      )
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection(conn.id)}
                      disabled={testingId === conn.id}
                      title="Test connection health"
                    >
                      {testingId === conn.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <HeartPulse className="h-4 w-4" />
                      )}
                    </Button>
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

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending Invitations
              </p>
              {pendingInvitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-dashed p-2.5 bg-muted/10">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">{inv.recruiter_email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.client_id && (
                      <Badge variant="outline" className="text-xs py-0">
                        {clients.find(c => c.id === inv.client_id)?.name || 'Client'}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs py-0">
                      Pending
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                onClick={() => handleConnect(selectedClientId !== 'all' && selectedClientId !== 'org-level' ? selectedClientId : undefined)}
                disabled={isConnecting}
                variant={activeConnections.length > 0 ? 'outline' : 'default'}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {activeConnections.length > 0 ? 'Add Calendar' : 'Connect Calendar'}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(true)}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Invite by Email
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { fetchConnections(); fetchInvitations(); }}
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
              Select a client above, then connect a calendar or invite a recruiter by email. The AI will use client-specific calendars first, 
              falling back to org-level connections if none are set for a client.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <ResponsiveDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        title="Invite Recruiter to Connect Calendar"
        description="Send an email invitation so a recruiter can connect their calendar without needing access to this admin panel."
        footer={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button onClick={handleSendInvite} disabled={isSendingInvite || !inviteEmail.trim()} className="flex-1 sm:flex-initial">
              {isSendingInvite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
              Recruiter's Email
            </label>
            <Input
              id="invite-email"
              type="email"
              placeholder="recruiter@company.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendInvite()}
            />
          </div>

          {selectedClientId !== 'all' && selectedClientId !== 'org-level' && (
            <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-muted/30">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                This calendar will be linked to <strong>{clientName}</strong>
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            The recruiter will receive an email with a link to authorize their calendar. The link expires in 7 days.
            They must have an existing account with the same email address for the connection to be stored.
          </p>
        </div>
      </ResponsiveDialog>
    </>
  );
}
