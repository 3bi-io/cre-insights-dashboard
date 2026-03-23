/**
 * Sticky sidebar for job details page (desktop)
 * Shows apply CTA, company info, salary, share card
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { DollarSign, MapPin, ExternalLink, Mic } from 'lucide-react';
import { JobShareActions } from './JobShareActions';

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
}: JobSidebarProps) => {
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
              <p className="text-sm text-muted-foreground">{company}</p>
            </div>

            {salary && (
              <div className="flex items-center gap-2 justify-center text-sm bg-success/10 text-success rounded-lg px-3 py-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{salary}</span>
              </div>
            )}

            {location && (
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}

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

            <Button
              variant="outline"
              className="w-full"
              onClick={onVoiceApply}
              disabled={isVoiceConnected}
            >
              <Mic className="w-4 h-4 mr-2" />
              Apply with Voice
            </Button>
          </CardContent>
        </Card>

        {/* Share Card */}
        <JobShareActions canonicalUrl={canonicalUrl} title={title} company={company} variant="card" />
      </div>
    </div>
  );
};
