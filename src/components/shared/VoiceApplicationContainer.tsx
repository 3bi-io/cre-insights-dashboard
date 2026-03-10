/**
 * Self-contained voice application container
 * Encapsulates useElevenLabsVoice + VoiceApplicationPanel wiring
 */

import React, { createContext, useContext } from 'react';
import { useElevenLabsVoice } from '@/features/elevenlabs/hooks';
import { VoiceApplicationPanel } from '@/features/elevenlabs';
import type { JobContext } from '@/features/elevenlabs';

interface VoiceApplicationContextValue {
  isConnected: boolean;
  selectedJob: JobContext | null;
  startVoiceApplication: (job: JobContext) => Promise<void>;
  isVoiceConnectedToJob: (jobId: string) => boolean;
}

const VoiceApplicationContext = createContext<VoiceApplicationContextValue | null>(null);

export const useVoiceApplication = () => {
  const ctx = useContext(VoiceApplicationContext);
  if (!ctx) throw new Error('useVoiceApplication must be used within VoiceApplicationContainer');
  return ctx;
};

interface VoiceApplicationContainerProps {
  children: React.ReactNode;
}

export const VoiceApplicationContainer = ({ children }: VoiceApplicationContainerProps) => {
  const {
    isConnected,
    selectedJob,
    isSpeaking,
    canSendFeedback,
    transcripts,
    pendingUserTranscript,
    pendingAgentTranscript,
    startVoiceApplication,
    endVoiceApplication,
    setVolume,
    sendFeedback,
    sendUserActivity,
    getInputFrequencyData,
    getOutputFrequencyData,
  } = useElevenLabsVoice();

  const isVoiceConnectedToJob = (jobId: string) => isConnected && selectedJob?.jobId === jobId;

  return (
    <VoiceApplicationContext.Provider
      value={{ isConnected, selectedJob, startVoiceApplication, isVoiceConnectedToJob }}
    >
      {children}
      <VoiceApplicationPanel
        isConnected={isConnected}
        isSpeaking={isSpeaking}
        canSendFeedback={canSendFeedback}
        selectedJob={selectedJob}
        transcripts={transcripts}
        pendingUserTranscript={pendingUserTranscript}
        pendingAgentTranscript={pendingAgentTranscript}
        onEnd={endVoiceApplication}
        setVolume={setVolume}
        sendFeedback={sendFeedback}
        sendUserActivity={sendUserActivity}
        getInputFrequencyData={getInputFrequencyData}
        getOutputFrequencyData={getOutputFrequencyData}
      />
    </VoiceApplicationContext.Provider>
  );
};
