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

  const { isConnected, isSpeaking, connect, disconnect } = useVoiceAgentConnection({
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

  const startVoiceApplication = async (job: JobContext) => {
    try {
      const agentId = 'agent_1501k4dpkf2hfevs6eh5e7947a65';
      
      const jobContext = {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription || `This is a ${job.jobTitle} position`,
        company: job.company || 'C.R. England',
        location: job.location || 'Various locations',
        salary: job.salary || 'Competitive salary'
      };

      setSelectedJob(jobContext);
      
      // Delay to ensure overrides are applied
      setTimeout(() => {
        connect(agentId, { jobContext });
      }, 0);
      
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
    startVoiceApplication,
    endVoiceApplication,
  };
};