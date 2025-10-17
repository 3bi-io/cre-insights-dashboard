import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useVoiceAgentConnection } from '@/features/elevenlabs';
import { Mic, MicOff, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DemoPage = () => {
  const { toast } = useToast();
  const [isTestRunning, setIsTestRunning] = useState(false);

  const { 
    isConnected, 
    isConnecting, 
    isSpeaking, 
    connect, 
    disconnect 
  } = useVoiceAgentConnection({
    onConnect: () => {
      toast({
        title: "Voice Agent Connected",
        description: "Successfully connected to ElevenLabs voice agent. Try speaking!",
      });
      setIsTestRunning(false);
    },
    onDisconnect: () => {
      toast({
        title: "Voice Agent Disconnected",
        description: "Voice session has ended.",
      });
      setIsTestRunning(false);
    },
    onError: (error) => {
      console.error('Voice agent error:', error);
      setIsTestRunning(false);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to voice agent. Check console for details.",
        variant: "destructive",
      });
    }
  });

  const handleStartTest = async () => {
    setIsTestRunning(true);
    try {
      // Using the demo agent ID
      const agentId = 'agent_1501k4dpkf2hfevs6eh5e7947a65';
      await connect(agentId);
    } catch (error) {
      console.error('Failed to start test:', error);
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
                  disabled={isConnecting || isTestRunning}
                  className="px-8 py-6 text-lg"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  {isConnecting || isTestRunning ? 'Starting...' : 'Start Voice Test'}
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
                  <span className="ml-2 font-mono">agent_1501k4d...</span>
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
