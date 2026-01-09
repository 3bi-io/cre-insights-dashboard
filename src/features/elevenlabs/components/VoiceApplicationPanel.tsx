/**
 * Voice Application Panel
 * Fullscreen modal displayed during voice application sessions
 * Provides distraction-free experience with connection status and live transcripts
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mic, Volume2 } from 'lucide-react';
import { VoiceConnectionStatus } from './VoiceConnectionStatus';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { JobContext, LiveTranscriptMessage } from '../types';
import { cn } from '@/lib/utils';

interface VoiceApplicationPanelProps {
  isConnected: boolean;
  isSpeaking: boolean;
  selectedJob: JobContext | null;
  transcripts: LiveTranscriptMessage[];
  pendingUserTranscript?: string;
  pendingAgentTranscript?: string;
  onEnd: () => void;
}

export const VoiceApplicationPanel: React.FC<VoiceApplicationPanelProps> = ({
  isConnected,
  isSpeaking,
  selectedJob,
  transcripts,
  pendingUserTranscript,
  pendingAgentTranscript,
  onEnd,
}) => {
  if (!isConnected || !selectedJob) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">Voice Application</h1>
          <p className="text-sm text-muted-foreground truncate">
            {selectedJob.jobTitle} • {selectedJob.company}
          </p>
        </div>
        <Button
          variant="destructive"
          size="default"
          onClick={onEnd}
          className="ml-4 shrink-0"
        >
          <Phone className="w-4 h-4 mr-2" />
          End Call
        </Button>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        {/* Voice visualization area */}
        <div className="flex flex-col items-center justify-center py-6 sm:py-8">
          {/* Animated voice indicator */}
          <div className={cn(
            "relative w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300",
            isSpeaking 
              ? "bg-primary/20 ring-4 ring-primary/30 ring-offset-2 ring-offset-background" 
              : "bg-muted/50"
          )}>
            {/* Pulsing rings when speaking */}
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-primary/20 animate-pulse" />
              </>
            )}
            
            {/* Center icon */}
            <div className={cn(
              "relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors",
              isSpeaking ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {isSpeaking ? (
                <Volume2 className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
              ) : (
                <Mic className="w-6 h-6 sm:w-8 sm:h-8" />
              )}
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-4">
            <VoiceConnectionStatus
              isConnected={isConnected}
              isSpeaking={isSpeaking}
            />
          </div>
        </div>

        {/* Live transcript - takes remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <LiveTranscriptPanel
            transcripts={transcripts}
            pendingUserTranscript={pendingUserTranscript}
            pendingAgentTranscript={pendingAgentTranscript}
            isSpeaking={isSpeaking}
            isConnected={isConnected}
            fullscreen
          />
        </div>
      </div>

      {/* Footer with helpful tips */}
      <footer className="p-4 border-t bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Speak clearly and wait for the agent to finish before responding
        </p>
      </footer>
    </div>
  );
};
