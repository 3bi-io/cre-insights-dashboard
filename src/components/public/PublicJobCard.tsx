import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, DollarSign, Building2, Clock, ExternalLink, Mic, Info, Sparkles } from 'lucide-react';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { JobContext } from '@/features/elevenlabs';
import { sanitizers } from '@/utils/validation';
import { renderJobDescription } from '@/utils/markdownRenderer';
import { isAspenViewJob, transformAspenViewDescription } from '@/utils/aspenviewDescriptionTransformer';
import { useIsVoiceSupported } from '@/hooks/useVoiceCompatibility';
import { getDisplayCompanyName, formatSalary } from '@/utils/jobDisplayUtils';
import { JobReadinessBadges, type JobReadinessStage } from '@/components/shared';
import type { JobLocationVariant } from '@/utils/aspenviewJobGrouping';
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

/** Returns true if job was posted within the last 48 hours */
const isNewJob = (createdAt: string) => {
  const posted = new Date(createdAt).getTime();
  const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
  return posted > twoDaysAgo;
};

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
  const isNew = isNewJob(job.created_at);
  const locationVariants: JobLocationVariant[] | undefined = job.locationVariants;
  const isMultiLocation = locationVariants && locationVariants.length > 1;

  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
  const applyUrl = job.apply_url || `/apply?job_id=${job.id}`;
  const isExternalApply = !!job.apply_url && !job.apply_url.includes('applyai.jobs');
  const showVoiceButton = hasVoiceAgent && isVoiceSupported && onVoiceApply && !isExternalApply && !isMultiLocation;

  // Derive readiness stages from available data (visual-only for now)
  const completedStages: JobReadinessStage[] = ['posted'];
  // Future: check intake completion for 'human_review' and 'final_approval'
  if (hasVoiceAgent) {
    completedStages.push('human_review', 'final_approval', 'voice_active');
  }

  
  const handleVoiceApply = () => {
    if (!onVoiceApply || !hasVoiceAgent) return;
    onVoiceApply({
      jobId: job.id,
      jobTitle: displayTitle,
      jobDescription: displayDescription || `This is a ${displayTitle} position`,
      company: companyName,
      location: displayLocation || 'Various locations',
      salary: salary || 'Competitive salary',
      organizationId: job.organization_id || undefined,
      clientId: job.client_id || undefined,
    });
  };

  return (
    <Card className="group relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 hover:border-primary/30 touch-manipulation overflow-hidden">
      {/* Subtle hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardHeader className="pb-4 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 mb-2">
              {isNew && (
                <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                  New
                </Badge>
              )}
              {hasVoiceAgent && (
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold px-2 py-0.5">
                  <Mic className="h-3 w-3 mr-1" />
                  Voice
                </Badge>
              )}
              {job.job_categories?.name && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {job.job_categories.name}
                </Badge>
              )}
            </div>

            <Link to={`/jobs/${job.id}`} className="hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded">
              <CardTitle className="text-lg sm:text-xl leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {displayTitle}
              </CardTitle>
            </Link>
            <div className="flex items-center gap-3 text-sm sm:text-base text-muted-foreground">
              <LogoAvatar size="md" className="sm:h-12 sm:w-12">
                {job.clients?.logo_url ? (
                  <LogoAvatarImage 
                    src={job.clients.logo_url} 
                    alt={`${companyName} logo`}
                    loading="lazy"
                  />
                ) : (
                  <LogoAvatarFallback iconSize="md" />
                )}
              </LogoAvatar>
              <span className="font-medium text-foreground">{companyName}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {displayDescription && (
          <div 
            className="text-sm sm:text-base text-muted-foreground line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: isAspenViewJob(job.client_id)
              ? renderJobDescription(transformAspenViewDescription(displayDescription, displayTitle, job.state, job.city), true)
              : renderJobDescription(displayDescription)
            }}
          />
        )}

        <div className="space-y-2">
          {isMultiLocation ? (
            <div className="space-y-1">
              {locationVariants.map((variant) => (
                <div key={variant.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" aria-hidden="true" />
                  <span>{variant.location}</span>
                </div>
              ))}
            </div>
          ) : displayLocation ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" aria-hidden="true" />
              <span>{displayLocation}</span>
            </div>
          ) : null}

          {salary && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 flex-shrink-0 text-success/70" aria-hidden="true" />
              <span className="font-semibold text-foreground">{salary}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Consolidated CTA */}
        <div className="pt-4 border-t space-y-2">
          {/* Multi-location: per-location apply buttons */}
          {isMultiLocation ? (
            <>
              {locationVariants.map((variant) => {
                const variantApplyUrl = variant.apply_url || `/apply?job_id=${variant.id}`;
                const variantIsExternal = !!variant.apply_url && !variant.apply_url.includes('applyai.jobs');
                const locationLabel = variant.location || 'this location';
                
                return variantIsExternal ? (
                  <a key={variant.id} href={variantApplyUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button 
                      className="w-full min-h-[44px] text-sm font-semibold" 
                      size="default"
                      variant="default"
                    >
                      Apply to {locationLabel}
                      <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                  </a>
                ) : (
                  <Link key={variant.id} to={variantApplyUrl} className="block">
                    <Button 
                      className="w-full min-h-[44px] text-sm font-semibold" 
                      size="default"
                      variant="default"
                    >
                      Apply to {locationLabel}
                      <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                    </Button>
                  </Link>
                );
              })}
              
              {/* View Details for grouped jobs links to first variant */}
              <Link to={`/jobs/${job.id}`} className="block">
                <Button className="w-full" size="default" variant="outline">
                  View Details
                </Button>
              </Link>
            </>
          ) : (
            <>
              {/* Primary CTA — direct apply */}
              {isExternalApply ? (
                <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button 
                    className="w-full min-h-[48px] text-base font-semibold" 
                    size="lg"
                    variant="default"
                  >
                    Apply Now
                    <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </a>
              ) : (
                <Link to={applyUrl} className="block">
                  <Button 
                    className="w-full min-h-[48px] text-base font-semibold" 
                    size="lg"
                    variant="default"
                  >
                    Apply Now
                    <ExternalLink className="w-4 h-4 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              )}

              {/* Secondary CTA — view full details */}
              <Link to={`/jobs/${job.id}`} className="block">
                <Button 
                  className="w-full" 
                  size="default"
                  variant="outline"
                >
                  View Details
                </Button>
              </Link>
              
              {showVoiceButton && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        className="w-full min-h-[44px] text-sm" 
                        size="default" 
                        variant={isVoiceConnected ? "secondary" : "outline"}
                        onClick={handleVoiceApply}
                        disabled={isVoiceConnected}
                        aria-label={isVoiceConnected ? 'Voice application in progress' : 'Apply using voice conversation'}
                      >
                        <Mic className="w-4 h-4 mr-2" aria-hidden="true" />
                        {isVoiceConnected ? 'Voice Active' : 'Apply with Voice'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm">
                        Speak directly with our AI assistant to apply. Requires microphone access.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {hasVoiceAgent && !isVoiceSupported && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>Voice apply requires a modern browser with microphone support.</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
