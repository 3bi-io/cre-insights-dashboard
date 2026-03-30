import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface VoiceConversationsSectionProps {
  clientId: string;
}

export const VoiceConversationsSection: React.FC<VoiceConversationsSectionProps> = ({ clientId }) => {
  const queryClient = useQueryClient();
  const queryKey = ['client-voice-conversations', clientId];

  // Realtime subscription
  useEffect(() => {
    const channelName = `client-conversations-${crypto.randomUUID()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'elevenlabs_conversations',
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, queryClient]);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Get voice agents for this client
      const { data: agents } = await supabase
        .from('voice_agents')
        .select('id, agent_name, is_outbound_enabled')
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (!agents?.length) return { conversations: [], agents: [], kpis: null };

      const agentIds = agents.map(a => a.id);
      const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

      // Get recent conversations for these agents
      const { data: conversations } = await supabase
        .from('elevenlabs_conversations')
        .select('id, conversation_id, voice_agent_id, status, duration_seconds, started_at, ended_at, metadata')
        .in('voice_agent_id', agentIds)
        .order('started_at', { ascending: false })
        .limit(25);

      const convs = conversations || [];

      // KPIs
      const totalConversations = convs.length;
      const completedConvs = convs.filter(c => c.status === 'done' || c.status === 'completed');
      const completionRate = totalConversations > 0 ? Math.round((completedConvs.length / totalConversations) * 100) : 0;
      const durations = convs.map(c => c.duration_seconds).filter((d): d is number => d != null && d > 0);
      const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

      return {
        conversations: convs.map(c => ({
          ...c,
          agentName: agentMap[c.voice_agent_id || '']?.agent_name || 'Unknown',
          isOutbound: agentMap[c.voice_agent_id || '']?.is_outbound_enabled || false,
        })),
        agents,
        kpis: { totalConversations, completionRate, avgDuration },
      };
    },
    enabled: !!clientId,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.conversations.length) return null;

  const { conversations, kpis } = data;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case 'done':
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'in_progress':
      case 'active': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'failed':
      case 'error': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Phone className="w-5 h-5 text-primary" />
        Voice Conversations
      </h2>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpis.totalConversations}</p>
                  <p className="text-xs text-muted-foreground">Recent Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpis.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatDuration(kpis.avgDuration)}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversations Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Agent</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Direction</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Duration</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map(conv => (
                  <tr key={conv.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-3 text-foreground">
                      {conv.started_at ? format(new Date(conv.started_at), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-foreground">{conv.agentName}</td>
                    <td className="py-2.5 px-3">
                      {conv.isOutbound ? (
                        <span className="inline-flex items-center gap-1 text-orange-500">
                          <PhoneOutgoing className="w-3.5 h-3.5" /> Outbound
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-500">
                          <PhoneIncoming className="w-3.5 h-3.5" /> Inbound
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-foreground">{formatDuration(conv.duration_seconds)}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className={`text-xs ${statusColor(conv.status)}`}>
                        {conv.status || 'unknown'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
