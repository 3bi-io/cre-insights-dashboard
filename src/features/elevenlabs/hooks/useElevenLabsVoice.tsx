/**
 * ElevenLabs Voice Hook
 * Provides voice application functionality using ElevenLabs agents
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  useVoiceAgentConnection, 
  JobContext 
} from '@/features/elevenlabs';
import { useJobBenefits, benefitsToVoiceContext } from '@/config/benefits.config';

export const useElevenLabsVoice = () => {
  const [selectedJob, setSelectedJob] = useState<JobContext | null>(null);
  const { toast } = useToast();

  const { 
    isConnected,
    isConnecting,
    connectionProgress,
    isSpeaking, 
    canSendFeedback,
    transcripts, 
    pendingUserTranscript,
    pendingAgentTranscript,
    clearTranscripts,
    connect, 
    disconnect,
    cancelConnection,
    setVolume,
    sendFeedback,
    sendUserActivity,
    getInputFrequencyData,
    getOutputFrequencyData,
  } = useVoiceAgentConnection({
    onConnect: () => {
      toast({
        title: "Voice Agent Connected",
        description: "Voice agent is ready! Tell the agent about your interest in applying."
      });
    },
    onDisconnect: () => {
      setSelectedJob(null);
      toast({
        title: "Voice Session Ended",
        description: "Voice application session ended."
      });
    },
    onError: () => {
      toast({
        title: "Voice Agent Error",
        description: "Voice agent encountered an error. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startVoiceApplication = async (job: JobContext) => {
    try {
      const jobContext = {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription || `This is a ${job.jobTitle} position`,
        company: job.company || 'Company',
        location: job.location || 'Various locations',
        salary: job.salary || 'Competitive salary',
        organizationId: job.organizationId,
        clientId: job.clientId,
        candidateName: job.candidateName,
        requirements: job.requirements,
        benefits: job.benefits
      };

      setSelectedJob(jobContext);
      
      // Use org/client-aware routing if org context is available, otherwise fall back to global agent
      const connectionOptions = jobContext.organizationId
        ? { jobContext, organizationId: jobContext.organizationId, clientId: jobContext.clientId }
        : { jobContext, useGlobalAgent: true };
      
      await connect(null, connectionOptions);
      
    } catch (error: any) {
      toast({
        title: "Voice Application Failed", 
        description: "Failed to start voice application.",
        variant: "destructive",
      });
    }
  };

  const endVoiceApplication = async () => {
    await disconnect();
  };

  const cancelVoiceApplication = () => {
    cancelConnection();
    setSelectedJob(null);
  };

  return {
    isConnected,
    isConnecting,
    connectionProgress,
    selectedJob,
    isSpeaking,
    canSendFeedback,
    transcripts,
    pendingUserTranscript,
    pendingAgentTranscript,
    clearTranscripts,
    startVoiceApplication,
    endVoiceApplication,
    cancelVoiceApplication,
    setVolume,
    sendFeedback,
    sendUserActivity,
    getInputFrequencyData,
    getOutputFrequencyData,
  };
};
