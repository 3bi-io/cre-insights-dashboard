import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  useVoiceAgentConnection, 
  createAgentOverrides, 
  JobContext 
} from '@/features/elevenlabs';

export const useElevenLabsVoice = () => {
  const [selectedJob, setSelectedJob] = useState<JobContext | null>(null);
  const { toast } = useToast();

  const agentOverrides = useMemo(() => {
    return selectedJob ? createAgentOverrides(selectedJob) : undefined;
  }, [selectedJob]);

  const { 
    isConnected, 
    isSpeaking, 
    transcripts, 
    pendingUserTranscript,
    clearTranscripts,
    connect, 
    disconnect 
  } = useVoiceAgentConnection({
    agentOverrides,
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

  const startVoiceApplication = async (job: JobContext & { voiceAgentId?: string }) => {
    try {
      if (!job.voiceAgentId) {
        toast({
          title: "Voice Agent Not Available",
          description: "This organization hasn't configured a voice agent yet.",
          variant: "destructive",
        });
        return;
      }
      
      const jobContext = {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription || `This is a ${job.jobTitle} position`,
        company: job.company || 'C.R. England',
        location: job.location || 'Various locations',
        salary: job.salary || 'Competitive salary',
        // Interview agent fields
        candidateName: job.candidateName,
        requirements: job.requirements,
        benefits: job.benefits
      };

      setSelectedJob(jobContext);
      
      // Connect directly - cleanup effect no longer triggers on conversation object changes
      await connect(job.voiceAgentId!, { jobContext });
      
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

  return {
    isConnected,
    selectedJob,
    isSpeaking,
    transcripts,
    pendingUserTranscript,
    clearTranscripts,
    startVoiceApplication,
    endVoiceApplication,
  };
};