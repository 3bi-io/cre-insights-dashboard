import { useState } from 'react';
import { useConversation } from '@11labs/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to voice agent');
      setIsConnected(true);
      toast({
        title: "Voice Agent Connected",
        description: "Voice agent is ready! Tell the agent about your interest in applying."
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from voice agent');
      setIsConnected(false);
      setSelectedJob(null);
      toast({
        title: "Voice Session Ended",
        description: "Voice application session ended."
      });
    },
    onMessage: (message) => {
      console.log('Voice agent message:', message);
    },
    onError: (error) => {
      console.error('Voice agent error:', error);
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

      const agentId = 'agent_01jwedntnjf7tt0qma00a2276r';
      
      // Prepare comprehensive job context for the agent
      const jobContext = {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription || `This is a ${job.jobTitle} position`,
        company: job.company || 'C.R. England',
        location: job.location || 'Various locations',
        salary: job.salary || 'Competitive salary'
      };

      console.log('Starting voice application for job:', jobContext);

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
      await conversation.startSession({ signedUrl: data.signedUrl });
      
      // Send job context to the voice agent immediately after connection
      const contextMessage = {
        jobContext: {
          ...jobContext,
          instructions: `You are helping someone apply for the position: ${job.jobTitle}. 
          Job Description: ${job.jobDescription || 'Details available upon application'}. 
          Company: ${job.company || 'C.R. England'}. 
          Location: ${job.location || 'Various locations'}.
          Salary: ${job.salary || 'Competitive compensation package'}.
          
          Please guide them through the application process and collect their information professionally. 
          Make sure to mention the specific job details when appropriate during the conversation.`
        }
      };
      
      console.log('Sending job context to voice agent:', contextMessage);
      
    } catch (error: any) {
      console.error('Failed to start voice application:', error);
      
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
      console.error('Failed to end voice application:', error);
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