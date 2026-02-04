import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, Building2, Clock, ExternalLink, Mic, Info } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { JobContext } from '@/features/elevenlabs';
import { sanitizers } from '@/utils/validation';
import { useIsVoiceSupported } from '@/hooks/useVoiceCompatibility';
import { getDisplayCompanyName } from '@/utils/jobDisplayUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  const isVoiceSupported = useIsVoiceSupported();
  const displayTitle = job.title || job.job_title || 'Untitled Job';
  const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : null);
  const displayDescription = job.job_summary || job.description;
  const companyName = getDisplayCompanyName(job);
  const hasVoiceAgent = !!job.voiceAgent;

  // Only show voice button if device supports it AND job has voice agent
  const showVoiceButton = hasVoiceAgent && isVoiceSupported && onVoiceApply;

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

  // Create apply URL with job information (org_slug removed for privacy)
  const applyUrl = `/apply?job_id=${job.id}`;
  
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
    <Card className="hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border touch-manipulation">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link to={`/jobs/${job.id}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded">
              <CardTitle className="text-lg sm:text-xl leading-tight mb-2 line-clamp-2">
                {displayTitle}
              </CardTitle>
            </Link>
            <div className="flex items-center gap-3 text-sm sm:text-base text-muted-foreground mb-2">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border">
                {job.clients?.logo_url ? (
                  <AvatarImage 
                    src={job.clients.logo_url} 
                    alt={`${companyName} logo`}
                    className="object-contain p-1 bg-background"
                    loading="lazy"
                  />
                ) : null}
                <AvatarFallback className="bg-muted">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-foreground">{companyName}</span>
            </div>
            {job.job_categories?.name && (
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {job.job_categories.name}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayDescription && (
          <div 
            className="text-sm sm:text-base text-muted-foreground line-clamp-3 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizers.sanitizeHtml(displayDescription) }}
          />
        )}

        <div className="space-y-2 sm:space-y-3">
          {displayLocation && (
            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-primary/70" aria-hidden="true" />
              <span>{displayLocation}</span>
            </div>
          )}

          {salary && (
            <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-success/70" aria-hidden="true" />
              <span className="font-medium text-foreground">{salary}</span>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base text-muted-foreground">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {job.dest_city && job.dest_state && (
          <div className="text-sm sm:text-base">
            <span className="font-medium">Destination:</span>
            <span className="text-muted-foreground ml-1">
              {job.dest_city}, {job.dest_state}
            </span>
          </div>
        )}

        {/* Action buttons - mobile-first with proper touch targets */}
        <div className="pt-4 border-t space-y-3">
          <Link to={`/jobs/${job.id}`} className="block">
            <Button 
              className="w-full min-h-[48px] text-base" 
              size="lg" 
              variant="outline"
            >
              View Details
            </Button>
          </Link>
          <Link to={applyUrl} className="block">
            <Button 
              className="w-full min-h-[48px] text-base font-semibold" 
              size="lg"
            >
              Apply Now
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 ml-2" aria-hidden="true" />
            </Button>
          </Link>
          
          {/* Voice button - only shown if device supports WebRTC */}
          {showVoiceButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    className="w-full min-h-[48px] text-base" 
                    size="lg" 
                    variant={isVoiceConnected ? "secondary" : "outline"}
                    onClick={handleVoiceApply}
                    disabled={isVoiceConnected}
                    aria-label={isVoiceConnected ? 'Voice application in progress' : 'Apply using voice conversation'}
                  >
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 mr-2" aria-hidden="true" />
                    {isVoiceConnected ? 'Voice Application Active' : 'Apply with Voice'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    Speak directly with our AI assistant to apply for this position. 
                    Requires microphone access.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Show helpful message for users with voice agent but unsupported device */}
          {hasVoiceAgent && !isVoiceSupported && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                Voice application requires a modern browser with microphone support. 
                Please use the "Apply Now" button above.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
