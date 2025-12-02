import React, { useState, useMemo } from 'react';
import { AdminPageLayout } from '@/features/shared';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bot, MessageSquare, AudioLines, Volume2, Mic, BarChart3 } from 'lucide-react';
import { useVoiceAgents } from '@/hooks/useVoiceAgents';
import { useElevenLabsConversations } from '@/hooks/useElevenLabsConversations';
import { ConversationHistoryTable } from '@/components/voice/ConversationHistoryTable';
import { ConversationAnalytics } from '@/components/voice/ConversationAnalytics';
import { ConversationFilters } from '@/components/voice/ConversationFilters';
import { ConversationExport } from '@/components/voice/ConversationExport';
import { OrganizationAgentAssignment } from '@/components/voice/OrganizationAgentAssignment';
import { WebhookManager } from '@/components/integrations/WebhookManager';
import VoiceAgentCard from '@/components/voice/VoiceAgentCard';
import VoiceAgentDialog from '@/components/voice/VoiceAgentDialog';
import { VoiceLibrary } from '@/components/voice/VoiceLibrary';
import { TextToSpeechPanel } from '@/components/voice/TextToSpeechPanel';
import { ElevenLabsUsageAnalytics } from '@/components/voice/ElevenLabsUsageAnalytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const ElevenLabsAdmin = () => {
  const { userRole } = useAuth();
  const { 
    voiceAgents, 
    isLoading: loadingAgents,
    createVoiceAgent,
    updateVoiceAgent,
    deleteVoiceAgent,
    isCreating,
    isUpdating,
    isDeleting
  } = useVoiceAgents();
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const {
    conversations: allConversations,
    loadingConversations,
    conversationsError,
    syncConversations,
    isSyncing,
    downloadAudio,
    isDownloadingAudio,
  } = useElevenLabsConversations(
    selectedAgent === 'all' ? undefined : selectedAgent
  );

  // Apply filters
  const filteredConversations = useMemo(() => {
    if (!allConversations) return [];

    return allConversations.filter(conv => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const agentName = conv.voice_agents?.agent_name?.toLowerCase() || '';
        const orgName = conv.voice_agents?.organizations?.name?.toLowerCase() || '';
        const conversationId = conv.conversation_id?.toLowerCase() || '';
        
        if (!agentName.includes(searchLower) && 
            !orgName.includes(searchLower) && 
            !conversationId.includes(searchLower)) {
          return false;
        }
      }

      if (statusFilter !== 'all' && conv.status !== statusFilter) {
        return false;
      }

      if (dateFrom) {
        const convDate = format(new Date(conv.started_at), 'yyyy-MM-dd');
        if (convDate < dateFrom) return false;
      }

      if (dateTo) {
        const convDate = format(new Date(conv.started_at), 'yyyy-MM-dd');
        if (convDate > dateTo) return false;
      }

      return true;
    });
  }, [allConversations, searchTerm, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleSyncConversations = () => {
    if (selectedAgent === 'all') {
      voiceAgents?.forEach(agent => {
        syncConversations(agent.elevenlabs_agent_id);
      });
    } else {
      const agent = voiceAgents?.find(a => a.id === selectedAgent);
      if (agent) {
        syncConversations(agent.elevenlabs_agent_id);
      }
    }
  };

  const totalConversations = allConversations?.length || 0;
  const filteredCount = filteredConversations.length;
  const activeAgents = voiceAgents?.filter(a => a.is_active).length || 0;
  const totalDuration = allConversations?.reduce((sum, conv) => sum + (conv.duration_seconds || 0), 0) || 0;

  const pageActions = (
    <div className="flex items-center gap-2">
      {voiceAgents && voiceAgents.length > 0 && (
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {voiceAgents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.agent_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <ConversationExport 
        conversations={filteredConversations}
        disabled={loadingConversations}
      />
      <Button
        onClick={handleSyncConversations}
        disabled={isSyncing || !voiceAgents || voiceAgents.length === 0}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        Sync
      </Button>
    </div>
  );

  return (
    <AdminPageLayout
      title="Voice Agents"
      description="Manage AI voice agents, conversations, and transcripts"
      requiredRole={['admin', 'super_admin']}
      actions={pageActions}
      isLoading={loadingAgents}
    >
      <div className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Bot className="h-4 w-4" />
          <AlertDescription>
            Each organization needs a unique ElevenLabs agent ID. Get yours from the{' '}
            <a 
              href="https://elevenlabs.io/app/conversational-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              ElevenLabs Dashboard
            </a>
          </AlertDescription>
        </Alert>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgents}</div>
              <p className="text-xs text-muted-foreground">
                {voiceAgents?.length || 0} total agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversations}</div>
              <p className="text-xs text-muted-foreground">Across all agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <AudioLines className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.floor(totalDuration / 60)}m</div>
              <p className="text-xs text-muted-foreground">{totalDuration}s total</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="conversations" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="agents">Voice Agents</TabsTrigger>
            <TabsTrigger value="voices">
              <Volume2 className="h-4 w-4 mr-1" />
              Voices
            </TabsTrigger>
            <TabsTrigger value="tts">
              <Mic className="h-4 w-4 mr-1" />
              TTS
            </TabsTrigger>
            <TabsTrigger value="api">
              <BarChart3 className="h-4 w-4 mr-1" />
              API
            </TabsTrigger>
            {userRole === 'super_admin' && (
              <>
                <TabsTrigger value="assignments">Org Assignments</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="conversations" className="space-y-4">
            <ConversationFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              dateFrom={dateFrom}
              onDateFromChange={setDateFrom}
              dateTo={dateTo}
              onDateToChange={setDateTo}
              onClearFilters={clearFilters}
            />

            <Card>
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
                <CardDescription>
                  {filteredCount === totalConversations 
                    ? `Viewing all ${totalConversations} conversations`
                    : `Showing ${filteredCount} of ${totalConversations} conversations`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingConversations ? (
                  <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
                ) : conversationsError ? (
                  <Alert variant="destructive">
                    <AlertDescription>Failed to load conversations. Please check your permissions.</AlertDescription>
                  </Alert>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations found</p>
                    <p className="text-sm mt-2">Try syncing conversations or adjusting your filters</p>
                  </div>
                ) : (
                  <ConversationHistoryTable
                    conversations={filteredConversations}
                    onDownloadAudio={downloadAudio}
                    isDownloadingAudio={isDownloadingAudio}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {loadingConversations ? (
              <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
            ) : (
              <ConversationAnalytics conversations={allConversations || []} />
            )}
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Voice Agents</h3>
                <p className="text-sm text-muted-foreground">Manage your ElevenLabs AI voice agents</p>
              </div>
              <VoiceAgentDialog onSubmit={createVoiceAgent} isLoading={isCreating} />
            </div>

            {voiceAgents && voiceAgents.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {voiceAgents.map((agent) => (
                  <VoiceAgentCard 
                    key={agent.id} 
                    agent={agent}
                    onUpdate={updateVoiceAgent}
                    onDelete={deleteVoiceAgent}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Voice Agents</h3>
                  <p className="text-muted-foreground mb-4">Get started by creating your first voice agent</p>
                  <VoiceAgentDialog onSubmit={createVoiceAgent} isLoading={isCreating} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {userRole === 'super_admin' ? (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Organization Agent Assignments</h3>
                  <p className="text-sm text-muted-foreground">Assign unique ElevenLabs voice agents to each organization</p>
                </div>
                <OrganizationAgentAssignment />
              </>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Only super admins can manage organization agent assignments.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            {userRole === 'super_admin' ? (
              <WebhookManager />
            ) : (
              <Alert variant="destructive">
                <AlertDescription>Only super admins can manage webhooks.</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="voices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Voice Library
                </CardTitle>
                <CardDescription>Browse and preview all available ElevenLabs voices</CardDescription>
              </CardHeader>
              <CardContent>
                <VoiceLibrary />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tts" className="space-y-4">
            <TextToSpeechPanel />
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <ElevenLabsUsageAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageLayout>
  );
};

export default ElevenLabsAdmin;
