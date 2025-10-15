import React, { useState } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  Volume2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Building,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import VoiceAgentDialog from './VoiceAgentDialog';
import { logger } from '@/services/loggerService';

interface VoiceAgentCardProps {
  agent: any;
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
  const [isConnected, setIsConnected] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      logger.info('Connected to voice agent', { agentName: agent.agent_name }, 'VoiceAgent');
      setIsConnected(true);
      toast({
        title: "Connected",
        description: `Connected to ${agent.agent_name}!`
      });
    },
    onDisconnect: () => {
      logger.info('Disconnected from voice agent', { agentName: agent.agent_name }, 'VoiceAgent');
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: `Disconnected from ${agent.agent_name}.`
      });
    },
    onMessage: message => {
      logger.debug('Voice agent message received', { agentName: agent.agent_name }, 'VoiceAgent');
    },
    onError: error => {
      logger.error('Voice agent error', { agentName: agent.agent_name, error }, 'VoiceAgent');
      toast({
        title: "Error",
        description: `${agent.agent_name} encountered an error. Please try again.`,
        variant: "destructive"
      });
    }
  });

  const handleStartConversation = async () => {
    try {
      // Request microphone access first
      logger.debug('Requesting microphone access', undefined, 'VoiceAgent');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      logger.debug('Microphone access granted', undefined, 'VoiceAgent');

      // Get signed URL from our edge function
      logger.debug('Requesting signed URL', { agentId: agent.agent_id }, 'VoiceAgent');
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: { agentId: agent.agent_id }
      });

      if (error) {
        logger.error('Supabase function error', error, 'VoiceAgent');
        throw new Error(error.message || `Supabase function error: ${JSON.stringify(error)}`);
      }

      if (!data?.success || !data?.signedUrl) {
        throw new Error(data?.error || 'No signed URL received from edge function');
      }

      // Store the signed URL and start conversation
      setSignedUrl(data.signedUrl);
      logger.info('Starting conversation', undefined, 'VoiceAgent');

      const conversationId = await conversation.startSession({
        signedUrl: data.signedUrl
      });
      logger.info('Conversation started', { conversationId }, 'VoiceAgent');
    } catch (error) {
      logger.error('Failed to start conversation', error, 'VoiceAgent');
      
      let errorMessage = "Failed to connect to voice agent.";
      const errorString = error?.message || error?.toString() || 'Unknown error';
      
      if (errorString.includes('Agent ID')) {
        errorMessage = "Invalid Agent ID. Please check the ElevenLabs Agent ID.";
      } else if (errorString.includes('API key')) {
        errorMessage = "ElevenLabs API key not configured properly.";
      } else if (errorString.includes('getUserMedia')) {
        errorMessage = "Microphone access is required. Please allow microphone permissions.";
      }
      
      toast({
        title: "Connection Failed",
        description: `${errorMessage} Error: ${errorString}`,
        variant: "destructive"
      });
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      logger.error('Failed to end conversation', error, 'VoiceAgent');
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
            Agent ID: <code className="bg-muted px-1 rounded">{agent.agent_id}</code>
          </div>
          {agent.llm_model && (
            <div>
              LLM Model: <Badge variant="outline" className="text-xs">{agent.llm_model}</Badge>
            </div>
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-sm">
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleStartConversation} 
              className="flex-1"
              disabled={!agent.is_active}
            >
              <Phone className="w-4 h-4 mr-2" />
              Connect
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

        {/* Voice Status when connected */}
        {isConnected && (
          <Alert>
            <div className="flex items-center gap-2">
              {conversation.isSpeaking ? (
                <>
                  <Volume2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-500">Agent is speaking...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500">Listening...</span>
                </>
              )}
            </div>
          </Alert>
        )}

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