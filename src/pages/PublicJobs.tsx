import React, { useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  DollarSign, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Volume2,
  Building,
  Users,
  ArrowLeft,
  Link as LinkIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobListing {
  id: string;
  title: string;
  job_title?: string;
  job_summary?: string;
  location?: string;
  city?: string;
  state?: string;
  salary_min?: number;
  salary_max?: number;
  salary_type?: string;
  job_type?: string;
  experience_level?: string;
  client?: string;
  clients?: { name: string };
  job_categories?: { name: string };
  created_at: string;
}

const PublicJobs = () => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [agentId] = useState('agent_1501k4dpkf2hfevs6eh5e7947a65');
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to voice agent');
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "Voice agent is ready! Tell the agent about your interest in applying."
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from voice agent');
      setIsConnected(false);
      setSelectedJob(null);
      toast({
        title: "Disconnected",
        description: "Voice application session ended."
      });
    },
    onMessage: message => {
      console.log('Voice agent message:', message);
    },
    onError: error => {
      console.error('Voice agent error:', error);
      toast({
        title: "Error",
        description: "Voice agent encountered an error. Please try again.",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          job_categories:category_id(name),
          clients:client_id(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load job listings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceApplication = async (job: JobListing) => {
    setSelectedJob(job);
    
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function with only job title
      const { data, error } = await supabase.functions.invoke('elevenlabs-agent', {
        body: { 
          agentId,
          jobContext: {
            jobTitle: job.title || job.job_title,
            jobId: job.id
          }
        }
      });

      if (error) throw error;
      if (!data?.success || !data?.signedUrl) {
        throw new Error('Failed to get voice agent authorization');
      }

      // Start voice conversation with job context
      await conversation.startSession({ signedUrl: data.signedUrl });
      
      // Send job context to the voice agent immediately after connection
      setTimeout(() => {
        const jobContext = `I'm interested in applying for the ${job.title || job.job_title} position at ${job.clients?.name || job.client}. The job description is: ${job.job_summary || 'No description available'}. The location is ${job.location || `${job.city}, ${job.state}`}. Can you help me with the application process?`;
        console.log('Sending job context to voice agent:', jobContext);
      }, 1000);

    } catch (error) {
      console.error('Failed to start voice application:', error);
      setSelectedJob(null);
      
      let errorMessage = "Failed to start voice application.";
      if (error?.message?.includes('getUserMedia')) {
        errorMessage = "Microphone access is required for voice applications.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleEndVoiceApplication = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  const formatSalary = (min?: number, max?: number, type?: string) => {
    if (!min && !max) return null;
    
    const formatAmount = (amount: number) => {
      if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}K`;
      }
      return `$${amount}`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}${type ? `/${type}` : ''}`;
    }
    return `${formatAmount(min || max || 0)}${type ? `/${type}` : ''}`;
  };

  const formatLocation = (job: JobListing) => {
    if (job.location) return job.location;
    if (job.city && job.state) return `${job.city}, ${job.state}`;
    return 'Location not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                  alt="C.R. England" 
                  className="h-8 w-auto"
                />
              </Link>
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d8eed20-4fcb-4be0-adba-5d8a3a949c9e.png" 
                alt="C.R. England" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild>
                <Link to="/apply">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Traditional Apply
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Voice Application Status */}
      {selectedJob && (
        <div className="bg-primary/10 border-b">
          <div className="container mx-auto px-4 py-4 max-w-7xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div>
                  <p className="font-medium">Voice Application: {selectedJob.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? 'Connected - Speak naturally to apply' : 'Connecting to voice agent...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {conversation.isSpeaking && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-sm">Agent speaking...</span>
                  </div>
                )}
                <Button
                  onClick={handleEndVoiceApplication}
                  variant="destructive"
                  size="sm"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Application
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Discover exciting career opportunities at C.R. England. Apply instantly using our AI voice assistant or traditional application form.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 text-center">
              <Mic className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-blue-900 dark:text-blue-100">Voice Application</p>
              <p className="text-sm text-blue-700 dark:text-blue-200">Apply by speaking naturally with our AI assistant</p>
            </div>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Open Positions</h3>
            <p className="text-muted-foreground">
              There are currently no open positions. Please check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card key={job.id} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 line-clamp-2">
                        {job.title || job.job_title}
                      </CardTitle>
                      {(job.clients?.name || job.client) && (
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {job.clients?.name || job.client}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{formatLocation(job)}</span>
                    </div>
                    
                    {formatSalary(job.salary_min, job.salary_max, job.salary_type) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.job_type && (
                      <Badge variant="secondary" className="text-xs">
                        {job.job_type}
                      </Badge>
                    )}
                    {job.experience_level && (
                      <Badge variant="outline" className="text-xs">
                        {job.experience_level}
                      </Badge>
                    )}
                    {job.job_categories?.name && (
                      <Badge variant="outline" className="text-xs">
                        {job.job_categories.name}
                      </Badge>
                    )}
                  </div>

                  {job.job_summary && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.job_summary}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 pt-4">
                    <Button
                      onClick={() => handleVoiceApplication(job)}
                      disabled={selectedJob?.id === job.id}
                      className="w-full"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      {selectedJob?.id === job.id ? 'Voice Application Active' : 'Apply with Voice'}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/apply">
                        Traditional Application
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t mt-16">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 C.R. England. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicJobs;