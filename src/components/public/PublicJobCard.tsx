import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, Building2, Clock, ExternalLink, Mic } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { JobContext } from '@/features/elevenlabs';

interface PublicJobCardProps {
  job: any;
  onVoiceApply?: (jobContext: JobContext & { voiceAgentId?: string }) => void;
  isVoiceConnected?: boolean;
}

export const PublicJobCard: React.FC<PublicJobCardProps> = ({ 
  job, 
  onVoiceApply, 
  isVoiceConnected = false 
}) => {
  const displayTitle = job.title || job.job_title || 'Untitled Job';
  const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : null);
  const displayDescription = job.job_summary || job.description;
  const companyName = job.clients?.name || job.client || 'Company';
  const hasVoiceAgent = !!job.voiceAgent;

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    
    const formatAmount = (amount: number) => {
      if (type === 'hourly') return `$${amount}/hr`;
      if (type === 'yearly') return `$${amount.toLocaleString()}/yr`;
      return `$${amount.toLocaleString()}`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return formatAmount(min || max || 0);
  };

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);

  // Create apply URL with job information
  const applyUrl = `/apply?job_id=${job.id}&org_slug=${job.organizations?.slug || 'default'}`;
  
  const handleVoiceApply = () => {
    if (!onVoiceApply || !hasVoiceAgent) return;
    
    const jobContext = {
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: displayDescription || `This is a ${displayTitle} position`,
      company: companyName,
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive salary',
      voiceAgentId: job.voiceAgent?.agent_id
    };
    
    onVoiceApply(jobContext);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link to={`/jobs/${job.id}`} className="hover:underline">
              <CardTitle className="text-lg leading-tight mb-2 line-clamp-2">
                {displayTitle}
              </CardTitle>
            </Link>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <Avatar className="h-10 w-10 border">
                {job.clients?.logo_url ? (
                  <AvatarImage 
                    src={job.clients.logo_url} 
                    alt={`${companyName} logo`}
                    className="object-contain p-1 bg-background"
                    loading="lazy"
                  />
                ) : null}
                <AvatarFallback className="bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{companyName}</span>
            </div>
            {job.job_categories?.name && (
              <Badge variant="secondary" className="text-xs">
                {job.job_categories.name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayDescription && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {displayDescription}
          </p>
        )}

        <div className="space-y-2">
          {displayLocation && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{displayLocation}</span>
            </div>
          )}

          {salary && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span>{salary}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {job.dest_city && job.dest_state && (
          <div className="text-sm">
            <span className="font-medium">Destination:</span>
            <span className="text-muted-foreground ml-1">
              {job.dest_city}, {job.dest_state}
            </span>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <Link to={`/jobs/${job.id}`} className="block">
            <Button className="w-full" size="lg" variant="outline">
              View Details
            </Button>
          </Link>
          <Link to={applyUrl} className="block">
            <Button className="w-full" size="lg">
              Apply Now
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          
          {hasVoiceAgent && onVoiceApply && (
            <Button 
              className="w-full" 
              size="lg" 
              variant={isVoiceConnected ? "secondary" : "outline"}
              onClick={handleVoiceApply}
              disabled={isVoiceConnected}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isVoiceConnected ? 'Voice Application Active' : 'Apply with Voice'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};