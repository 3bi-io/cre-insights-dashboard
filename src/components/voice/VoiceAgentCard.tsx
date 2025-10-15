import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  PhoneOff, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceAgentDialog from './VoiceAgentDialog';
import { useVoiceAgentConnection, VoiceConnectionStatus, VoiceAgent } from '@/features/elevenlabs';

interface VoiceAgentCardProps {
  agent: VoiceAgent;
  onUpdate: (data: any) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const VoiceAgentCard: React.FC<VoiceAgentCardProps> = ({
  agent,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false
}) => {
  const { toast } = useToast();

  const { isConnected, isConnecting, isSpeaking, connect, disconnect } = useVoiceAgentConnection({
    onConnect: () => {
      toast({
        title: "Connected",
        description: `Connected to ${agent.agent_name}!`
      });
    },
    onDisconnect: () => {
      toast({
        title: "Disconnected",
        description: `Disconnected from ${agent.agent_name}.`
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: `${agent.agent_name} encountered an error. Please try again.`,
        variant: "destructive"
      });
    }
  });

  const handleStartConversation = async () => {
    try {
      await connect(agent.elevenlabs_agent_id);
    } catch (error) {
      // Error already handled by hook
    }
  };

  const handleEndConversation = async () => {
    try {
      await disconnect();
    } catch (error) {
      // Error already handled
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${agent.agent_name}"? This action cannot be undone.`)) {
      onDelete(agent.id);
    }
  };

  return (
    <Card className={`transition-all ${!agent.is_active ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {agent.organizations?.logo_url && (
                <img 
                  src={agent.organizations.logo_url} 
                  alt={agent.organizations.name} 
                  className="w-6 h-6 object-contain rounded"
                />
              )}
              {agent.agent_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="w-4 h-4" />
              {agent.organizations?.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={agent.is_active ? "default" : "secondary"}>
              {agent.is_active ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <VoiceAgentDialog
                    agent={agent}
                    onSubmit={onUpdate}
                    isLoading={isUpdating}
                    trigger={
                      <div className="flex items-center gap-2 w-full">
                        <Edit className="w-4 h-4" />
                        Edit
                      </div>
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {agent.description && (
          <p className="text-sm text-muted-foreground">{agent.description}</p>
        )}

        <div className="space-y-1 text-xs text-muted-foreground">
          <div>
            Agent ID: <code className="bg-muted px-1 rounded text-xs">{agent.elevenlabs_agent_id}</code>
          </div>
          {agent.llm_model && (
            <div>
              LLM Model: <Badge variant="outline" className="text-xs">{agent.llm_model}</Badge>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <VoiceConnectionStatus 
          isConnected={isConnected} 
          isSpeaking={isSpeaking}
        />

        {/* Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleStartConversation} 
              className="flex-1"
              disabled={!agent.is_active || isConnecting}
            >
              <Phone className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <Button 
              onClick={handleEndConversation} 
              variant="destructive" 
              className="flex-1"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        {!agent.is_active && (
          <Alert>
            <AlertDescription>
              This voice agent is inactive and cannot be used for conversations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceAgentCard;