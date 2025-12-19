import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Phone, Building, AlertTriangle, PlayCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceAgents } from '@/hooks/useVoiceAgents';
import VoiceAgentDialog from '@/components/voice/VoiceAgentDialog';
import VoiceAgentCard from '@/components/voice/VoiceAgentCard';

const VoiceAgent = () => {
  const { userRole } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const {
    voiceAgents,
    isLoading,
    error,
    createVoiceAgent,
    updateVoiceAgent,
    deleteVoiceAgent,
    isCreating,
    isUpdating,
    isDeleting
  } = useVoiceAgents();

  // Check if user has proper permissions
  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin or super admin permissions to access voice agents.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading voice agents: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Voice Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage AI voice agents across organizations
            {userRole === 'super_admin' && (
              <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
            )}
          </p>
        </div>
        <VoiceAgentDialog
          onSubmit={createVoiceAgent}
          isLoading={isCreating}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !voiceAgents || voiceAgents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No voice agents configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first voice agent to enable AI-powered conversations for organizations.
            </p>
            <VoiceAgentDialog
              onSubmit={createVoiceAgent}
              isLoading={isCreating}
              trigger={
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Voice Agent
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{voiceAgents.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {voiceAgents.filter(agent => agent.is_active).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(voiceAgents.map(agent => agent.organization_id)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inactive Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-500">
                  {voiceAgents.filter(agent => !agent.is_active).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Voice Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>How to configure and use voice agents</CardDescription>
            </div>
            <Link to="/voice-demo">
              <Button variant="outline" size="sm">
                <PlayCircle className="h-4 w-4 mr-2" />
                View Demo Call
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Create a voice agent by clicking "Add Voice Agent" and providing your ElevenLabs Agent ID</li>
            <li>Assign the agent to an organization from the dropdown</li>
            <li>Click "Connect" on any active agent to start a voice conversation</li>
            <li>Allow microphone access when prompted to speak with the AI agent</li>
            <li>The agent will respond with voice and can perform configured actions</li>
            <li>Click "Disconnect" to end the conversation when finished</li>
          </ol>
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> You'll need a valid ElevenLabs API key configured in the system and 
              Agent IDs from your ElevenLabs Conversational AI dashboard to use voice agents.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceAgent;