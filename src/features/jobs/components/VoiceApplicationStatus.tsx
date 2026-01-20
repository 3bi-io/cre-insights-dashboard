import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff } from 'lucide-react';

interface JobContext {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  company?: string;
  location?: string;
  salary?: string;
}

interface VoiceApplicationStatusProps {
  isConnected: boolean;
  selectedJob: JobContext | null;
  isSpeaking: boolean;
  onEndCall: () => void;
}

export const VoiceApplicationStatus: React.FC<VoiceApplicationStatusProps> = ({
  isConnected,
  selectedJob,
  isSpeaking,
  onEndCall,
}) => {
  if (!isConnected || !selectedJob) {
    return null;
  }

  return (
    <Card className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div>
              <p className="font-medium">Voice Application: {selectedJob.jobTitle}</p>
              <p className="text-sm text-muted-foreground">
                {isConnected ? 'Connected - Speak naturally to apply' : 'Connecting to voice agent...'}
              </p>
            </div>
            {isSpeaking && (
              <div className="flex items-center gap-2 text-blue-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">Agent speaking...</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEndCall}
            className="flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            End Call
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
