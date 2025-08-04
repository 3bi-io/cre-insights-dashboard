import React, { useState } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const VoiceAgent = () => {
  const [agentId, setAgentId] = useState('agent_01jwedntnjf7tt0qma00a2276r');
  const [isConnected, setIsConnected] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to voice agent');
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Voice agent is now ready to chat!"
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from voice agent');
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Voice agent conversation ended."
      });
    },
    onMessage: message => {
      console.log('Message received:', message);
    },
    onError: error => {
      console.error('Voice agent error:', error);
      toast({
        title: "Error",
        description: "Voice agent encountered an error. Please try again.",
        variant: "destructive"
      });
    }
  });
  const handleStartConversation = async () => {
    if (!agentId.trim()) {
      toast({
        title: "Agent ID Required",
        description: "Please enter your ElevenLabs Agent ID to start the conversation.",
        variant: "destructive"
      });
      return;
    }
    try {
      // Request microphone access first
      console.log('Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      console.log('Microphone access granted');

      // Get signed URL from our edge function
      console.log('Requesting signed URL for agent:', agentId.trim());
      const {
        data,
        error
      } = await supabase.functions.invoke('elevenlabs-agent', {
        body: {
          agentId: agentId.trim()
        }
      });
      console.log('Edge function response:', {
        data,
        error
      });
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || `Supabase function error: ${JSON.stringify(error)}`);
      }
      if (!data) {
        throw new Error('No response data from edge function');
      }
      if (!data.success) {
        console.error('Edge function returned error:', data);
        throw new Error(data.error || `Edge function failed: ${JSON.stringify(data)}`);
      }
      if (!data.signedUrl) {
        throw new Error('No signed URL received from edge function');
      }

      // Store the signed URL and start conversation
      setSignedUrl(data.signedUrl);
      console.log('Starting conversation with signed URL:', data.signedUrl);

      // Use the startSession method with just the signedUrl parameter
      const conversationId = await conversation.startSession({
        signedUrl: data.signedUrl
      });
      console.log('Conversation started with ID:', conversationId);
    } catch (error) {
      console.error('Failed to start conversation:', error);

      // More specific error messaging
      let errorMessage = "Failed to connect to voice agent.";
      const errorString = error?.message || error?.toString() || 'Unknown error';
      if (errorString.includes('Agent ID')) {
        errorMessage = "Invalid Agent ID. Please check your ElevenLabs Agent ID.";
      } else if (errorString.includes('API key')) {
        errorMessage = "ElevenLabs API key not configured properly.";
      } else if (errorString.includes('signed_url') || errorString.includes('signedUrl')) {
        errorMessage = "Failed to get authorization from ElevenLabs. Please check your Agent ID.";
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
      console.error('Failed to end conversation:', error);
    }
  };
  const handleVolumeChange = async (volume: number) => {
    try {
      await conversation.setVolume({
        volume
      });
    } catch (error) {
      console.error('Failed to change volume:', error);
    }
  };
  return <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Voice Agent</h1>
          <p className="text-muted-foreground mt-1">Interact with ElevenLabs AI voice agent</p>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              AI Voice Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent ID Input */}
            <div className="space-y-2">
              <Label htmlFor="agentId">Agent ID</Label>
              <Input id="agentId" placeholder="Enter your ElevenLabs Agent ID" value={agentId} onChange={e => setAgentId(e.target.value)} disabled={isConnected} />
              <p className="text-sm text-muted-foreground">You can find your Agent ID in the dashboard under Conversational AI.</p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected to voice agent' : 'Not connected'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4">
              {!isConnected ? <Button onClick={handleStartConversation} className="flex items-center gap-2" disabled={!agentId.trim()}>
                  <Mic className="w-4 h-4" />
                  Start Conversation
                </Button> : <Button onClick={handleEndConversation} variant="destructive" className="flex items-center gap-2">
                  <PhoneOff className="w-4 h-4" />
                  End Conversation
                </Button>}
            </div>

            {/* Voice Status */}
            {isConnected && <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Voice Status</span>
                  <div className="flex items-center gap-2">
                    {conversation.isSpeaking ? <>
                        <Volume2 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-500">Agent is speaking...</span>
                      </> : <>
                        <Mic className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-500">Listening...</span>
                      </>}
                  </div>
                </div>

                {/* Volume Control */}
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <input id="volume" type="range" min="0" max="1" step="0.1" defaultValue="0.8" className="w-full" onChange={e => handleVolumeChange(parseFloat(e.target.value))} />
                </div>
              </div>}

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <h4 className="font-medium mb-2">How to use:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Your Agent ID is pre-configured above</li>
                <li>Click "Start Conversation" to begin</li>
                <li>Allow microphone access when prompted</li>
                <li>Speak naturally to interact with the voice agent</li>
                <li>The agent will respond with voice and can perform actions</li>
                <li>Click "End Conversation" when you're done</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default VoiceAgent;