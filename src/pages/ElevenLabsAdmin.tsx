import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bot, MessageSquare, AudioLines } from 'lucide-react';
import { useVoiceAgents } from '@/hooks/useVoiceAgents';
import { useElevenLabsConversations } from '@/hooks/useElevenLabsConversations';
import { ConversationHistoryTable } from '@/components/voice/ConversationHistoryTable';
import VoiceAgentCard from '@/components/voice/VoiceAgentCard';
import VoiceAgentDialog from '@/components/voice/VoiceAgentDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectedConversation, setSelectedConversation] = useState<any>(null);

  const {
    conversations,
    loadingConversations,
    syncConversations,
    isSyncing,
    downloadAudio,
    isDownloadingAudio,
  } = useElevenLabsConversations(
    selectedAgent === 'all' ? undefined : selectedAgent
  );

  // Check if user is super admin or org admin
  const isAuthorized = userRole === 'super_admin' || userRole === 'admin';

  if (!isAuthorized) {
    return (
      <PageLayout
        title="ElevenLabs Administration"
        description="Manage AI voice agents and conversations"
      >
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to access this page. Super admin or organization admin access required.
          </AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  const handleSyncConversations = () => {
    if (selectedAgent === 'all') {
      voiceAgents?.forEach(agent => {
        syncConversations(agent.agent_id);
      });
    } else {
      const agent = voiceAgents?.find(a => a.organization_id === selectedAgent);
      if (agent) {
        syncConversations(agent.agent_id);
      }
    }
  };

  const totalConversations = conversations?.length || 0;
  const activeAgents = voiceAgents?.filter(a => a.is_active).length || 0;
  const totalDuration = conversations?.reduce((sum, conv) => sum + (conv.duration_seconds || 0), 0) || 0;

  return (
    <PageLayout
      title="ElevenLabs Administration"
      description="Manage AI voice agents, conversations, and transcripts"
    >
      <div className="space-y-6">
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
              <p className="text-xs text-muted-foreground">
                Across all agents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <AudioLines className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor(totalDuration / 60)}m
              </div>
              <p className="text-xs text-muted-foreground">
                {totalDuration}s total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="conversations" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="agents">Voice Agents</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {voiceAgents && voiceAgents.length > 0 && (
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {voiceAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.organization_id}>
                        {agent.agent_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                onClick={handleSyncConversations}
                disabled={isSyncing || !voiceAgents || voiceAgents.length === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Conversations
              </Button>
            </div>
          </div>

          <TabsContent value="conversations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversation History</CardTitle>
                <CardDescription>
                  View and manage all voice agent conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingConversations ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : (
                  <ConversationHistoryTable
                    conversations={conversations || []}
                    onViewDetails={setSelectedConversation}
                    onDownloadAudio={downloadAudio}
                    isDownloadingAudio={isDownloadingAudio}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Voice Agents</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your ElevenLabs AI voice agents
                </p>
              </div>
              <VoiceAgentDialog 
                onSubmit={createVoiceAgent}
                isLoading={isCreating}
              />
            </div>

            {loadingAgents ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading voice agents...
              </div>
            ) : voiceAgents && voiceAgents.length > 0 ? (
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
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first voice agent
                  </p>
                  <VoiceAgentDialog 
                    onSubmit={createVoiceAgent}
                    isLoading={isCreating}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ElevenLabsAdmin;
