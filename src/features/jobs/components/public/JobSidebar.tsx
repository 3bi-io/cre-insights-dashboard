/**
 * Sticky sidebar for job details page (desktop)
 * Shows apply CTA, company info, salary, share card
 * Supports multi-location apply buttons for grouped AspenView jobs
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { DollarSign, MapPin, ExternalLink, Mic } from 'lucide-react';
import { ReadinessBadges } from '@/components/shared';
import { JobShareActions } from './JobShareActions';
import { isVoiceApplyEnabled } from '@/utils/aspenviewJobGrouping';
import type { JobLocationVariant } from '@/utils/aspenviewJobGrouping';

interface JobSidebarProps {
  title: string;
  company: string;
  logoUrl?: string | null;
  salary?: string | null;
  location?: string;
  applyUrl: string;
  isExternalApply?: boolean;
  canonicalUrl: string;
  onVoiceApply: () => void;
  isVoiceConnected: boolean;
  showVoiceButton?: boolean;
  locationVariants?: JobLocationVariant[];
  clientId?: string | null;
}

export const JobSidebar = ({
  title,
  company,
  logoUrl,
  salary,
  location,
  applyUrl,
  isExternalApply,
  canonicalUrl,
  onVoiceApply,
  isVoiceConnected,
  showVoiceButton = true,
  locationVariants,
  clientId,
}: JobSidebarProps) => {
  const isMultiLocation = locationVariants && locationVariants.length > 1;
  const isVoiceEnabled = isVoiceApplyEnabled(clientId);

  return (
    <div className="hidden lg:block">
      <div className="sticky top-20 space-y-4">
        {/* Apply Card */}
        <Card className="border-primary/20 shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <LogoAvatar size="xl" className="mx-auto mb-3">
                {logoUrl ? (
                  <LogoAvatarImage src={logoUrl} alt={`${company} logo`} />
                ) : (
                  <LogoAvatarFallback iconSize="lg" />
                )}
              </LogoAvatar>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{company}</p>
              <ReadinessBadges showVoiceApply={!!showVoiceButton || (isMultiLocation && isVoiceEnabled)} />
            </div>

            {salary && (
              <div className="flex items-center gap-2 justify-center text-sm bg-success/10 text-success rounded-lg px-3 py-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{salary}</span>
              </div>
            )}

            {isMultiLocation ? (
              <div className="space-y-1">
                {locationVariants.map((variant) => (
                  <div key={variant.id} className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{variant.location}</span>
                  </div>
                ))}
              </div>
            ) : location ? (
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            ) : null}

            {isMultiLocation ? (
              <div className="space-y-2">
                {locationVariants.map((variant) => {
                  const variantUrl = variant.apply_url || `/apply?job_id=${variant.id}`;
                  const variantIsExternal = !!variant.apply_url && !variant.apply_url.includes('applyai.jobs');
                  const locationLabel = variant.location || 'this location';

                  return variantIsExternal ? (
                    <a key={variant.id} href={variantUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full min-h-[44px] text-sm font-semibold" size="default">
                        Apply to {locationLabel}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <Link key={variant.id} to={variantUrl} className="block">
                      <Button className="w-full min-h-[44px] text-sm font-semibold" size="default">
                        Apply to {locationLabel}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  );
                })}

                {isVoiceEnabled && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onVoiceApply}
                    disabled={isVoiceConnected}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Apply with Voice
                  </Button>
                )}
              </div>
            ) : (
              <>
                {isExternalApply ? (
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <Button className="w-full min-h-[48px] text-base font-semibold" size="lg">
                      Apply Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                ) : (
                  <Link to={applyUrl} className="block">
                    <Button className="w-full min-h-[48px] text-base font-semibold" size="lg">
                      Apply Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}

                {showVoiceButton && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onVoiceApply}
                    disabled={isVoiceConnected}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Apply with Voice
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Share Card */}
        <JobShareActions canonicalUrl={canonicalUrl} title={title} company={company} variant="card" />
      </div>
    </div>
  );
};
