import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  PhoneOff, 
  PhoneOutgoing,
  MoreVertical, 
  Edit, 
  Trash2, 
  Building,
  AlertTriangle,
  Globe,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VoiceAgentDialog from './VoiceAgentDialog';
import { useVoiceAgentConnection, VoiceConnectionStatus, LiveTranscriptPanel, VoiceAgent } from '@/features/elevenlabs';
import { checkBrowserCompatibility, SUPPORTED_BROWSERS } from '@/features/elevenlabs/utils/browserCompatibility';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';
 import { CompanyLogo } from '@/components/shared';

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
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);
  const [browserCompatible, setBrowserCompatible] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Check browser compatibility on mount
  useEffect(() => {
    const check = checkBrowserCompatibility();
    if (!check.isSupported) {
      setBrowserWarning(check.warningMessage);
      setBrowserCompatible(false);
    }
  }, []);

  const { isConnected, isConnecting, isSpeaking, transcripts, pendingUserTranscript, connect, disconnect } = useVoiceAgentConnection({
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(agent.id);
    setDeleteDialogOpen(false);
  };

  return (
    <Card className={`transition-all ${!agent.is_active ? 'opacity-60' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
               <CompanyLogo
                 logoUrl={agent.organizations?.logo_url}
                 companyName={agent.organizations?.name || 'Organization'}
                 size="sm"
                 className="w-6 h-6"
               />
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
                  onClick={handleDeleteClick}
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
          <div className="flex items-center gap-2">
            <span>Browser:</span>
            <Badge variant={browserCompatible ? "outline" : "destructive"} className="text-xs">
              {browserCompatible ? "Compatible ✓" : "Not Supported"}
            </Badge>
          </div>
          {/* Channel Badges */}
          <div className="flex items-center gap-1 flex-wrap">
            <span>Channels:</span>
            {(agent.channels || ['phone']).map((ch) => (
              <Badge key={ch} variant="outline" className="text-xs gap-1">
                {ch === 'phone' && <Phone className="w-3 h-3" />}
                {ch === 'web' && <Globe className="w-3 h-3" />}
                {ch === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </Badge>
            ))}
          </div>
          {agent.is_outbound_enabled && (
            <div className="flex items-center gap-2">
              <PhoneOutgoing className="w-3 h-3" />
              <span>Outbound:</span>
              <Badge variant="default" className="text-xs">
                Enabled
              </Badge>
            </div>
          )}
        </div>

        {/* Browser Compatibility Warning */}
        {browserWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Not Compatible</AlertTitle>
            <AlertDescription className="space-y-2">
              <p className="text-sm">{browserWarning}</p>
              <div className="text-xs mt-2">
                <strong>Supported Browsers:</strong>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {SUPPORTED_BROWSERS.map((browser) => (
                    <li key={browser.name}>
                      {browser.name} {browser.minVersion}+ {browser.name === 'Chrome' ? '(recommended)' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Status */}
        <VoiceConnectionStatus 
          isConnected={isConnected} 
          isSpeaking={isSpeaking}
        />

        {/* Live Transcript Panel */}
        <LiveTranscriptPanel
          transcripts={transcripts}
          pendingUserTranscript={pendingUserTranscript}
          isSpeaking={isSpeaking}
          isConnected={isConnected}
        />

        {/* Controls */}
        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleStartConversation} 
              className="flex-1"
              disabled={!agent.is_active || isConnecting || !browserCompatible}
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

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Voice Agent"
        description={`Are you sure you want to delete "${agent.agent_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </Card>
  );
};

export default VoiceAgentCard;