/**
 * Founders Pass Voice CTA
 * Replaces standard navigation CTAs with an ElevenLabs voice agent experience.
 * Visitors interact with an AI agent that collects their info (company, needs, contact).
 */

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Phone, PhoneOff, Mic, Volume2, Loader2, X, Headphones } from 'lucide-react';
import { useVoiceAgentConnection } from '@/features/elevenlabs/hooks/useVoiceAgentConnection';
import { VoiceConnectionStatus, LiveTranscriptPanel } from '@/features/elevenlabs/components';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FoundersPassVoiceCTAProps {
  variant?: 'hero' | 'footer';
  className?: string;
}



export const FoundersPassVoiceCTA: React.FC<FoundersPassVoiceCTAProps> = ({
  variant = 'hero',
  className,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const {
    isConnected,
    isConnecting,
    connectionProgress,
    isSpeaking,
    transcripts,
    pendingUserTranscript,
    pendingAgentTranscript,
    connect,
    disconnect,
    cancelConnection,
  } = useVoiceAgentConnection({
    onConnect: () => {
      toast({ title: 'Connected', description: 'You\'re now speaking with our AI assistant.' });
    },
    onDisconnect: () => {
      toast({ title: 'Call Ended', description: 'Thanks for your interest in Founders Pass!' });
    },
    onError: () => {
      toast({
        title: 'Connection Error',
        description: 'Could not connect to the voice agent. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleStart = useCallback(async () => {
    setDialogOpen(true);
    try {
      await connect(null, { useGlobalAgent: true });
    } catch {
      // Error handled by hook
    }
  }, [connect]);

  const handleEnd = useCallback(async () => {
    try {
      await disconnect();
    } catch {
      // handled
    }
    setDialogOpen(false);
  }, [disconnect]);

  const handleCancel = useCallback(() => {
    cancelConnection();
    setDialogOpen(false);
  }, [cancelConnection]);

  const progressMessage = (() => {
    switch (connectionProgress) {
      case 'requesting-mic': return 'Requesting microphone access...';
      case 'fetching-token': return 'Establishing secure connection...';
      case 'connecting': return 'Starting conversation...';
      case 'connected': return 'Connected!';
      default: return 'Preparing...';
    }
  })();

  return (
    <>
      {/* Primary CTA — opens voice dialog */}
      <Button
        size="lg"
        className={cn(
          'text-lg px-8 py-6',
          variant === 'footer' && 'px-10',
          className,
        )}
        onClick={handleStart}
      >
        <Headphones className="mr-2 h-5 w-5" />
        Claim Your Founders Pass
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>

      {/* Voice Agent Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          if (isConnected) handleEnd();
          else if (isConnecting) handleCancel();
          else setDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden max-h-[90dvh] flex flex-col">
          <DialogTitle className="sr-only">Founders Pass Voice Agent</DialogTitle>
          
          {/* Header */}
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Founders Pass</h2>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Speak with our AI assistant' : 'Connecting to AI assistant...'}
              </p>
            </div>
            {isConnected && (
              <Button variant="destructive" size="sm" onClick={handleEnd}>
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            )}
          </header>

          {/* Connecting State */}
          {isConnecting && !isConnected && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              </div>
              <p className="text-sm text-muted-foreground mb-6">{progressMessage}</p>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}

          {/* Connected State */}
          {isConnected && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Voice visualization */}
              <div className="flex flex-col items-center py-6">
                <div className={cn(
                  'relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300',
                  isSpeaking
                    ? 'bg-primary/20 ring-4 ring-primary/30 ring-offset-2 ring-offset-background'
                    : 'bg-muted/50'
                )}>
                  {isSpeaking && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                      <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
                    </>
                  )}
                  <div className={cn(
                    'relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                    isSpeaking ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {isSpeaking ? (
                      <Volume2 className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <VoiceConnectionStatus isConnected={isConnected} isSpeaking={isSpeaking} />
                </div>
              </div>

              {/* Transcript */}
              <div className="flex-1 min-h-0 overflow-hidden border-t">
                <LiveTranscriptPanel
                  transcripts={transcripts}
                  pendingUserTranscript={pendingUserTranscript}
                  pendingAgentTranscript={pendingAgentTranscript}
                  isSpeaking={isSpeaking}
                  isConnected={isConnected}
                />
              </div>
            </div>
          )}

          {/* Not connecting and not connected — idle/error fallback */}
          {!isConnecting && !isConnected && dialogOpen && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Phone className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">Ready to connect?</p>
              <Button onClick={handleStart}>
                <Phone className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            </div>
          )}

          {/* Footer */}
          <footer className="p-3 border-t bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              Speak clearly • Your AI assistant will collect your info to get started
            </p>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
};
