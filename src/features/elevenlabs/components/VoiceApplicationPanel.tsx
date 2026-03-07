/**
 * Voice Application Panel
 * Fullscreen modal with real-time audio visualization, volume control, and post-call feedback
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Phone, Mic, Volume2, VolumeX, Loader2, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { VoiceConnectionStatus } from './VoiceConnectionStatus';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { AudioVisualizer } from './AudioVisualizer';
import { JobContext, LiveTranscriptMessage, ConnectionProgress } from '../types';
import { cn } from '@/lib/utils';

interface VoiceApplicationPanelProps {
  isConnected: boolean;
  isConnecting?: boolean;
  connectionProgress?: ConnectionProgress;
  isSpeaking: boolean;
  canSendFeedback?: boolean;
  selectedJob: JobContext | null;
  transcripts: LiveTranscriptMessage[];
  pendingUserTranscript?: string;
  pendingAgentTranscript?: string;
  onEnd: () => void;
  onCancel?: () => void;
  // SDK methods
  setVolume?: (volume: number) => void;
  sendFeedback?: (positive: boolean) => void;
  sendUserActivity?: () => void;
  getInputFrequencyData?: () => Uint8Array | undefined;
  getOutputFrequencyData?: () => Uint8Array | undefined;
}

const getProgressMessage = (progress: ConnectionProgress): string => {
  switch (progress) {
    case 'requesting-mic':
      return 'Requesting microphone access...';
    case 'fetching-token':
      return 'Establishing secure connection...';
    case 'connecting':
      return 'Starting conversation...';
    case 'connected':
      return 'Connected!';
    default:
      return 'Preparing...';
  }
};

export const VoiceApplicationPanel: React.FC<VoiceApplicationPanelProps> = ({
  isConnected,
  isConnecting = false,
  connectionProgress = 'idle',
  isSpeaking,
  canSendFeedback = false,
  selectedJob,
  transcripts,
  pendingUserTranscript,
  pendingAgentTranscript,
  onEnd,
  onCancel,
  setVolume,
  sendFeedback,
  sendUserActivity,
  getInputFrequencyData,
  getOutputFrequencyData,
}) => {
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const wasConnectedRef = useRef(false);

  // Detect disconnect to show feedback
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
    } else if (wasConnectedRef.current && !isConnected && !isConnecting) {
      setShowFeedback(true);
      wasConnectedRef.current = false;
    }
  }, [isConnected, isConnecting]);

  const handleVolumeChange = useCallback((values: number[]) => {
    const v = values[0];
    setVolumeState(v);
    setIsMuted(v === 0);
    setVolume?.(v);
  }, [setVolume]);

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      setVolumeState(1);
      setVolume?.(1);
    } else {
      setIsMuted(true);
      setVolumeState(0);
      setVolume?.(0);
    }
  }, [isMuted, setVolume]);

  const handleFeedback = useCallback((positive: boolean) => {
    sendFeedback?.(positive);
    setFeedbackGiven(true);
  }, [sendFeedback]);

  // Send user activity on any interaction
  const handleUserInteraction = useCallback(() => {
    sendUserActivity?.();
  }, [sendUserActivity]);

  // Post-call feedback overlay
  if (showFeedback && selectedJob && !isConnected && !isConnecting) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="flex flex-col items-center max-w-md mx-auto px-4 text-center">
          <h2 className="text-xl font-semibold mb-2">Call Ended</h2>
          <p className="text-sm text-muted-foreground mb-6">
            How was your experience applying for {selectedJob.jobTitle}?
          </p>

          {!feedbackGiven ? (
            <div className="flex gap-4 mb-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleFeedback(true)}
                disabled={!canSendFeedback}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="w-5 h-5 text-green-500" />
                Good
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleFeedback(false)}
                disabled={!canSendFeedback}
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-5 h-5 text-destructive" />
                Poor
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">
              Thanks for your feedback!
            </p>
          )}

          <Button variant="default" onClick={() => { setShowFeedback(false); setFeedbackGiven(false); }}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Connecting overlay
  if (isConnecting && selectedJob) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center">
        <div className="flex flex-col items-center max-w-md mx-auto px-4 text-center">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          </div>
          
          <h2 className="text-xl font-semibold mb-2">Connecting to Voice Agent</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {getProgressMessage(connectionProgress)}
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6 w-full">
            <p className="text-sm font-medium">{selectedJob.jobTitle}</p>
            <p className="text-xs text-muted-foreground">{selectedJob.company}</p>
          </div>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="min-w-[120px]">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!isConnected || !selectedJob) return null;

  const noopFreq = () => undefined;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
    >
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
        {/* Audio visualizer */}
        <div className="flex flex-col items-center justify-center py-4 sm:py-6">
          <AudioVisualizer
            getInputFrequencyData={getInputFrequencyData || noopFreq}
            getOutputFrequencyData={getOutputFrequencyData || noopFreq}
            isSpeaking={isSpeaking}
            isConnected={isConnected}
            className="max-w-lg mx-auto"
          />

          {/* Status */}
          <div className="mt-3">
            <VoiceConnectionStatus
              isConnected={isConnected}
              isSpeaking={isSpeaking}
            />
          </div>
        </div>

        {/* Live transcript */}
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

      {/* Footer with volume control */}
      <footer className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={handleMuteToggle}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.05}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Speak clearly and wait for the agent to finish before responding
        </p>
      </footer>
    </div>
  );
};
