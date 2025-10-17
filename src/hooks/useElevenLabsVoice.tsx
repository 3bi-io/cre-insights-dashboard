import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  useVoiceAgentConnection, 
  createAgentOverrides, 
  JobContext 
} from '@/features/elevenlabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useElevenLabsVoice = () => {
  const [selectedJob, setSelectedJob] = useState<JobContext | null>(null);
  const { toast } = useToast();
  const { organization } = useAuth();

  // Fetch the voice agent for the current organization
  const { data: voiceAgent } = useQuery({
    queryKey: ['organization-voice-agent', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data, error } = await supabase
        .from('voice_agents')
        .select('elevenlabs_agent_id')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

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
      // Use organization's voice agent if available, otherwise fallback to Demo agent
      const agentId = voiceAgent?.elevenlabs_agent_id || 'agent_3901k7s5pyt9fsfb17w72f8hf59z';
      
      const jobContext = {
        jobId: job.jobId,
        jobTitle: job.jobTitle,
        jobDescription: job.jobDescription || `This is a ${job.jobTitle} position`,
        company: job.company || organization?.name || 'Demo Company',
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