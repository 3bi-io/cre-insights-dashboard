/**
 * Voice Connection Status Component
 * Reusable component for displaying voice agent connection status
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Volume2 } from 'lucide-react';

interface VoiceConnectionStatusProps {
  isConnected: boolean;
  isSpeaking: boolean;
  className?: string;
}

export const VoiceConnectionStatus: React.FC<VoiceConnectionStatusProps> = ({
  isConnected,
  isSpeaking,
  className = ''
}) => {
  if (!isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="text-sm text-muted-foreground">Not connected</span>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-green-600">Connected</span>
      </div>

      <Alert className="mt-2">
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <>
              <Volume2 className="w-4 h-4 text-blue-500 animate-pulse" />
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
    </>
  );
};
