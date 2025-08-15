import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VoiceAgent = () => {
  const [agentId, setAgentId] = useState('agent_01jwedntnjf7tt0qma00a2276r');
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const handleStartConversation = async () => {
    if (!agentId.trim()) {
      toast({
        title: "Agent ID Required",
        description: "Please enter your ElevenLabs Agent ID to start the conversation.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Request microphone access first
      console.log('Requesting microphone access...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted');

      // Connect to our edge function WebSocket
      const wsUrl = `wss://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-agent`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to voice agent');
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Connected",
          description: "Voice agent is now ready to chat!"
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received from agent:', data);
        
        if (data.type === 'speaking_start') {
          setIsSpeaking(true);
        } else if (data.type === 'speaking_end') {
          setIsSpeaking(false);
        } else if (data.type === 'error') {
          toast({
            title: "Error",
            description: data.message || "Voice agent encountered an error.",
            variant: "destructive"
          });
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event);
        setIsConnected(false);
        setIsConnecting(false);
        setIsSpeaking(false);
        
        if (event.code !== 1000) {
          toast({
            title: "Disconnected",
            description: event.reason || "Voice agent conversation ended."
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        toast({
          title: "Connection Failed",
          description: "Failed to connect to voice agent. Please try again.",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsConnecting(false);
      
      let errorMessage = "Failed to connect to voice agent.";
      const errorString = error?.message || error?.toString() || 'Unknown error';
      
      if (errorString.includes('getUserMedia')) {
        errorMessage = "Microphone access is required. Please allow microphone permissions.";
      }
      
      toast({
        title: "Connection Failed",
        description: `${errorMessage} Error: ${errorString}`,
        variant: "destructive"
      });
    }
  };

  const handleEndConversation = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    toast({
      title: "Disconnected",
      description: "Voice agent conversation ended."
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Voice Agent</h1>
          <p className="text-muted-foreground mt-1">Interact with AI voice agent</p>
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
              <Input 
                id="agentId" 
                placeholder="Enter your ElevenLabs Agent ID" 
                value={agentId} 
                onChange={(e) => setAgentId(e.target.value)} 
                disabled={isConnected || isConnecting} 
              />
              <p className="text-sm text-muted-foreground">
                You can find your Agent ID in the ElevenLabs dashboard under Conversational AI.
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected to voice agent' : isConnecting ? 'Connecting...' : 'Not connected'}
              </span>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4">
              {!isConnected ? (
                <Button 
                  onClick={handleStartConversation} 
                  className="flex items-center gap-2" 
                  disabled={!agentId.trim() || isConnecting}
                >
                  <Mic className="w-4 h-4" />
                  {isConnecting ? 'Connecting...' : 'Start Conversation'}
                </Button>
              ) : (
                <Button 
                  onClick={handleEndConversation} 
                  variant="destructive" 
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Conversation
                </Button>
              )}
            </div>

            {/* Voice Status */}
            {isConnected && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Voice Status</span>
                  <div className="flex items-center gap-2">
                    {isSpeaking ? (
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
                </div>
              </div>
            )}

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
    </div>
  );
};

export default VoiceAgent;