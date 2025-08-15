import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mic, Phone, PhoneOff, Loader2 } from 'lucide-react';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentId] = useState('agent_01jwedntnjf7tt0qma00a2276r');
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const introMessage = useMemo(() => {
    const jobTitle = job.title || job.job_title || 'Position';
    const companyName = job.clients?.name || job.client || 'Company';
    const location = job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}` || 'Location not specified';
    const description = job.job_summary || 'No description provided';
    return `The candidate clicked Apply Now for ${jobTitle} at ${companyName} (${location}). Use this context and the description to personalize your questions. Description: ${description}`;
  }, [job]);

  const startConversation = async () => {
    setIsConnecting(true);
    
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to our edge function that proxies to ElevenLabs
      const wsUrl = `wss://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/elevenlabs-agent`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to voice agent');
        setIsConnecting(false);
        setHasStarted(true);
        
        // Send initial job context
        ws.send(JSON.stringify({
          type: 'job_context',
          data: {
            jobTitle: job.title || job.job_title,
            companyName: job.clients?.name || job.client,
            location: job.location || `${job.city || ''}${job.city && job.state ? ', ' : ''}${job.state || ''}`,
            description: job.job_summary,
            message: introMessage
          }
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received from agent:', data);
        
        if (data.type === 'speaking_start') {
          setIsSpeaking(true);
        } else if (data.type === 'speaking_end') {
          setIsSpeaking(false);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event);
        setHasStarted(false);
        setIsConnecting(false);
        setIsSpeaking(false);
        
        if (event.code !== 1000) {
          toast({
            title: "Connection Error",
            description: event.reason || "Connection to voice agent was lost.",
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to voice agent. Please try again.",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to access microphone or start voice conversation.",
        variant: "destructive",
      });
    }
  };

  const endConversation = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setHasStarted(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    onClose();
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
      <DialogContent className="max-w-2xl" aria-describedby="voice-application-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Voice Application - {job.title || job.job_title}
          </DialogTitle>
          <div id="voice-application-description" className="sr-only">
            Voice-powered job application interface for {job.title || job.job_title}. This dialog allows you to apply for the position using voice conversation with an AI recruiter.
          </div>
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

            {hasStarted && (
              <div className="flex flex-col items-center gap-4">
                {isSpeaking && (
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