import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoiceAgentConnection } from '@/features/elevenlabs';
import { Mic, MicOff, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const DemoPage = () => {
  const { toast } = useToast();
  const { organization } = useAuth();
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  const { 
    isConnected, 
    isConnecting, 
    isSpeaking, 
    connect, 
    disconnect 
  } = useVoiceAgentConnection({
    onConnect: () => {
      console.log('[Demo] Voice agent connected successfully');
      toast({
        title: "Voice Agent Connected",
        description: "Successfully connected to ElevenLabs voice agent. Try speaking!",
      });
      setIsTestRunning(false);
    },
    onDisconnect: () => {
      console.log('[Demo] Voice agent disconnected');
      toast({
        title: "Voice Agent Disconnected",
        description: "Voice session has ended.",
      });
      setIsTestRunning(false);
    },
    onError: (error) => {
      console.error('[Demo] Voice agent error:', error);
      setIsTestRunning(false);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to voice agent. Check console for details.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    const fetchVoiceAgent = async () => {
      if (!organization?.id) {
        setIsLoadingAgent(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('voice_agents')
          .select('elevenlabs_agent_id')
          .eq('organization_id', organization.id)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('[Demo] Error fetching voice agent:', error);
          toast({
            title: "Configuration Error",
            description: "Could not load voice agent configuration.",
            variant: "destructive",
          });
        } else if (data?.elevenlabs_agent_id) {
          console.log('[Demo] Voice agent loaded:', data.elevenlabs_agent_id);
          setAgentId(data.elevenlabs_agent_id);
        } else {
          toast({
            title: "No Voice Agent",
            description: "No active voice agent configured for this organization.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('[Demo] Failed to fetch voice agent:', error);
      } finally {
        setIsLoadingAgent(false);
      }
    };

    fetchVoiceAgent();
  }, [organization?.id, toast]);

  const handleStartTest = async () => {
    if (!agentId) {
      toast({
        title: "No Agent Available",
        description: "Voice agent configuration not loaded.",
        variant: "destructive",
      });
      return;
    }

    setIsTestRunning(true);
    try {
      console.log('[Demo] Starting voice test with agent:', agentId);
      await connect(agentId);
    } catch (error) {
      console.error('[Demo] Failed to start test:', error);
      setIsTestRunning(false);
    }
  };

  const handleStopTest = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Voice Agent Demo</h1>
          <p className="text-muted-foreground">
            Test the ElevenLabs voice agent integration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Voice Agent Test</CardTitle>
            <CardDescription>
              Click the button below to start a voice conversation with the AI agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-center gap-4 p-6 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500 animate-pulse' : 
                  isConnecting ? 'bg-yellow-500 animate-pulse' : 
                  'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              
              {isConnected && (
                <div className="flex items-center gap-2">
                  <Radio className={`w-4 h-4 ${isSpeaking ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">
                    {isSpeaking ? 'Agent Speaking' : 'Listening'}
                  </span>
                </div>
              )}
            </div>

            {/* Control Button */}
            <div className="flex justify-center">
              {!isConnected ? (
                <Button
                  size="lg"
                  onClick={handleStartTest}
                  disabled={isConnecting || isTestRunning || isLoadingAgent || !agentId}
                  className="px-8 py-6 text-lg"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  {isLoadingAgent ? 'Loading...' : isConnecting || isTestRunning ? 'Starting...' : 'Start Voice Test'}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStopTest}
                  className="px-8 py-6 text-lg"
                >
                  <MicOff className="mr-2 h-5 w-5" />
                  End Conversation
                </Button>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to test:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click "Start Voice Test" to connect to the voice agent</li>
                <li>Allow microphone access when prompted</li>
                <li>Wait for the connection to establish</li>
                <li>Start speaking - the agent will respond</li>
                <li>Click "End Conversation" when done</li>
              </ol>
            </div>

            {/* Technical Info */}
            <div className="p-4 rounded-lg bg-muted/30 text-xs space-y-2">
              <p className="font-medium">Technical Details:</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Agent ID:</span>
                  <span className="ml-2 font-mono">{agentId ? agentId.substring(0, 15) + '...' : 'Loading...'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2">{isConnected ? '✓ Active' : '○ Idle'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Connection:</span>
                  <span className="ml-2">{isConnecting ? 'Establishing...' : isConnected ? 'WebRTC' : 'Not connected'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Speaking:</span>
                  <span className="ml-2">{isSpeaking ? '🔊 Yes' : '○ No'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">If the connection fails, check:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground mt-2">
                <li>ELEVENLABS_API_KEY is configured in Supabase secrets</li>
                <li>The agent ID is correct and valid</li>
                <li>Microphone permissions are granted</li>
                <li>Network connection is stable</li>
                <li>Browser console for detailed error messages</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoPage;
