import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title?: string;
  job_title?: string;
  job_summary?: string;
  location?: string;
  city?: string;
  state?: string;
  clients?: { name: string };
  client?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  experience_level?: string;
  job_type?: string;
  remote_type?: string;
}

interface VoiceJobApplicationProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

const VoiceJobApplication: React.FC<VoiceJobApplicationProps> = ({ job, isOpen, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [agentId] = useState('agent_01jwedntnjf7tt0qma00a2276r'); // ElevenLabs agent ID
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to voice agent');
      setIsConnecting(false);
      setHasStarted(true);
      
      // Send job information to the agent after connection
      setTimeout(() => {
        sendJobDetailsToAgent();
      }, 1000);
    },
    onDisconnect: () => {
      console.log('Disconnected from voice agent');
      setHasStarted(false);
      setIsConnecting(false);
    },
    onError: (error) => {
      console.error('Voice agent error:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice agent. Please try again.",
        variant: "destructive",
      });
    },
    onMessage: (message) => {
      console.log('Agent message:', message);
    }
  });

  const sendJobDetailsToAgent = () => {
    const jobTitle = job.title || job.job_title || 'Position';
    const companyName = job.clients?.name || job.client || 'Company';
    const location = job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}` || 'Location not specified';
    const description = job.job_summary || 'No description provided';
    
    const jobInfo = `I'm interested in applying for the ${jobTitle} position at ${companyName} located in ${location}. Here's the job description: ${description}`;
    
    // Send job information as a message to the agent
    console.log('Sending job info to agent:', jobInfo);
    
    // This would typically be sent through the conversation interface
    // The agent should be configured to handle this initial context
  };

  const startConversation = async () => {
    setIsConnecting(true);
    
    try {
      // Get signed URL for the voice agent
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: { agentId }
      });

      if (error) throw error;

      if (data.signedUrl) {
        // Use the correct ElevenLabs API parameters
        const conversationId = await conversation.startSession({ 
          agentId: agentId
        });
        
        console.log('Conversation started with ID:', conversationId);
        
        // Set up initial context with job details
        const jobContext = {
          jobTitle: job.title || job.job_title,
          companyName: job.clients?.name || job.client,
          location: job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}`,
          description: job.job_summary,
          jobId: job.id
        };
        
        console.log('Job context set:', jobContext);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to start voice conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
      onClose();
    } catch (error) {
      console.error('Error ending conversation:', error);
      onClose();
    }
  };

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    
    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)} ${type || 'per year'}`;
    }
    
    if (min) {
      return `From ${formatAmount(min)} ${type || 'per year'}`;
    }
    
    if (max) {
      return `Up to ${formatAmount(max)} ${type || 'per year'}`;
    }
    
    return null;
  };

  // Auto-start conversation when dialog opens
  useEffect(() => {
    if (isOpen && !hasStarted && !isConnecting) {
      startConversation();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Voice Application - {job.title || job.job_title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Job Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{job.title || job.job_title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {(job.clients?.name || job.client) && (
                  <Badge variant="secondary">{job.clients?.name || job.client}</Badge>
                )}
                {(job.location || job.city || job.state) && (
                  <Badge variant="outline">
                    {job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}`}
                  </Badge>
                )}
                {job.job_type && (
                  <Badge variant="outline">{job.job_type}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {job.job_summary && (
                <p className="text-muted-foreground mb-4">{job.job_summary}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {formatSalary(job.salary_min, job.salary_max, job.salary_type) && (
                  <div>
                    <span className="font-medium">Salary:</span>
                    <span className="ml-2">{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</span>
                  </div>
                )}
                {job.experience_level && (
                  <div>
                    <span className="font-medium">Experience:</span>
                    <span className="ml-2">{job.experience_level}</span>
                  </div>
                )}
                {job.remote_type && (
                  <div>
                    <span className="font-medium">Work Type:</span>
                    <span className="ml-2">{job.remote_type}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voice Interface */}
          <div className="text-center space-y-4">
            {isConnecting && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Connecting to voice agent...</p>
              </div>
            )}

            {hasStarted && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-green-600">
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">Voice conversation active</span>
                </div>
                <p className="text-muted-foreground max-w-md">
                  Our AI recruiter will help you apply for this position. Please speak clearly and answer the questions.
                </p>
              </div>
            )}

            {conversation.status === 'connected' && hasStarted && (
              <div className="flex flex-col items-center gap-4">
                {conversation.isSpeaking && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-sm">Agent is speaking...</span>
                  </div>
                )}
                
                <Button 
                  onClick={endConversation}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Call
                </Button>
              </div>
            )}

            {!isConnecting && !hasStarted && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-muted-foreground">Ready to start your voice application?</p>
                <Button 
                  onClick={startConversation}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Start Voice Application
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceJobApplication;