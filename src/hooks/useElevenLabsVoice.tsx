import { useState, useMemo } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/services/loggerService';

interface JobContext {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  company?: string;
  location?: string;
  salary?: string;
}

export const useElevenLabsVoice = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobContext | null>(null);
  const { toast } = useToast();

  const agentOverrides = useMemo(() => {
    if (!selectedJob) return undefined;
    const company = selectedJob.company || 'C.R. England';
    const prompt = `You are assisting a candidate to apply for ${selectedJob.jobTitle} at ${company}. Location: ${selectedJob.location || 'Various locations'}. Salary: ${selectedJob.salary || 'Competitive compensation package'}. Job Description: ${selectedJob.jobDescription || 'Details will be collected during application.'} Personalize the conversation to this specific job and guide the applicant through the application.`;
    return {
      agent: {
        prompt: { prompt },
        firstMessage: `I can help you apply for ${selectedJob.jobTitle} at ${company}. May I start with your first name?`,
        language: 'en'
      }
    } as const;
  }, [selectedJob]);

  const conversation = useConversation({
    overrides: agentOverrides,
    onConnect: () => {
      logger.info('Connected to voice agent', undefined, 'ElevenLabsVoice');
      setIsConnected(true);
      toast({
        title: "Voice Agent Connected",
        description: "Voice agent is ready! Tell the agent about your interest in applying."
      });
    },
    onDisconnect: () => {
      logger.info('Disconnected from voice agent', undefined, 'ElevenLabsVoice');
      setIsConnected(false);
      setSelectedJob(null);
      toast({
        title: "Voice Session Ended",
        description: "Voice application session ended."
      });
    },
    onMessage: (message) => {
      logger.debug('Voice agent message received', undefined, 'ElevenLabsVoice');
    },
    onError: (error) => {
      logger.error('Voice agent error', error, 'ElevenLabsVoice');
      toast({
        title: "Voice Agent Error",
        description: "Voice agent encountered an error. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startVoiceApplication = async (job: JobContext) => {
    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const agentId = 'agent_1501k4dpkf2hfevs6eh5e7947a65';
      
      // Prepare comprehensive job context for the agent
      const jobContext = {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription || `This is a ${job.jobTitle} position`,
        company: job.company || 'C.R. England',
        location: job.location || 'Various locations',
        salary: job.salary || 'Competitive salary'
      };

      logger.info('Starting voice application', { jobId: jobContext.jobId, jobTitle: jobContext.jobTitle }, 'ElevenLabsVoice');

      // Get signed URL with job context
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: {
          agentId,
          jobContext
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to get voice agent authorization');
      }

      setSelectedJob(job);
      
      // Start voice conversation with job context
      // Delay start to ensure overrides are applied with selected job context
      setTimeout(() => {
        conversation.startSession({ signedUrl: data.signedUrl });
      }, 0);
      
      // Job context is applied via conversation overrides; no manual message needed.
      
    } catch (error: any) {
      logger.error('Failed to start voice application', error, 'ElevenLabsVoice');
      
      let errorMessage = "Failed to start voice application.";
      if (error?.message?.includes?.('getUserMedia')) {
        errorMessage = "Microphone access is required for voice applications.";
      }
      
      toast({
        title: "Voice Application Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const endVoiceApplication = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      logger.error('Failed to end voice application', error, 'ElevenLabsVoice');
    }
  };

  return {
    isConnected,
    selectedJob,
    isSpeaking: conversation.isSpeaking,
    startVoiceApplication,
    endVoiceApplication,
  };
};