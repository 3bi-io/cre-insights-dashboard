/**
 * Voice Application Panel
 * Floating panel displayed during voice application sessions
 * Shows connection status and live transcripts
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { VoiceConnectionStatus } from './VoiceConnectionStatus';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { JobContext, LiveTranscriptMessage } from '../types';

interface VoiceApplicationPanelProps {
  isConnected: boolean;
  isSpeaking: boolean;
  selectedJob: JobContext | null;
  transcripts: LiveTranscriptMessage[];
  pendingUserTranscript?: string;
  onEnd: () => void;
}

export const VoiceApplicationPanel: React.FC<VoiceApplicationPanelProps> = ({
  isConnected,
  isSpeaking,
  selectedJob,
  transcripts,
  pendingUserTranscript,
  onEnd,
}) => {
  if (!isConnected || !selectedJob) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-xl border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Voice Application</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={onEnd}
            >
              <Phone className="w-3 h-3 mr-1" />
              End
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedJob.jobTitle} • {selectedJob.company}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <VoiceConnectionStatus
            isConnected={isConnected}
            isSpeaking={isSpeaking}
          />
          <LiveTranscriptPanel
            transcripts={transcripts}
            pendingUserTranscript={pendingUserTranscript}
            isSpeaking={isSpeaking}
            isConnected={isConnected}
          />
        </CardContent>
      </Card>
    </div>
  );
};
