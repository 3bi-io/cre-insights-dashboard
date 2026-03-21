import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { MapPin, Building2, Share2 } from 'lucide-react';

interface ApplicationHeaderProps {
  jobTitle?: string | null;
  clientName?: string | null;
  clientLogoUrl?: string | null;
  location?: string | null;
  source?: string | null;
  isLoading?: boolean;
  isExpressMode?: boolean;
}

// Source display name mapping
const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'x': 'X',
  'twitter': 'X',
  'facebook': 'Facebook',
  'fb': 'Facebook',
  'instagram': 'Instagram',
  'ig': 'Instagram',
  'linkedin': 'LinkedIn',
  'indeed': 'Indeed',
  'google': 'Google',
  'craigslist': 'Craigslist',
};

const formatSource = (source: string): string => {
  const lowerSource = source.toLowerCase();
  return SOURCE_DISPLAY_NAMES[lowerSource] || source.charAt(0).toUpperCase() + source.slice(1);
};

// Loading skeleton component
const HeaderSkeleton = memo(() => (
  <div className="text-center mb-6 sm:mb-8" aria-busy="true" aria-label="Loading job details">
    <Skeleton className="h-20 w-20 mx-auto mb-4 rounded-2xl" />
    <Skeleton className="h-8 w-64 mx-auto mb-2" />
    <Skeleton className="h-5 w-48 mx-auto" />
  </div>
));
HeaderSkeleton.displayName = 'HeaderSkeleton';

// Metadata badge component
interface MetadataBadgeProps {
  icon: React.ElementType;
  children: React.ReactNode;
}

const MetadataBadge = memo(({ icon: Icon, children }: MetadataBadgeProps) => (
  <span className="inline-flex items-center gap-1">
    <Icon className="h-4 w-4" aria-hidden="true" />
    {children}
  </span>
));
MetadataBadge.displayName = 'MetadataBadge';

export const ApplicationHeader = memo(({ 
  jobTitle, 
  clientName, 
  clientLogoUrl,
  location, 
  source,
  isLoading = false,
  isExpressMode = false,
}: ApplicationHeaderProps) => {
  if (isLoading) {
    return <HeaderSkeleton />;
  }

  const hasContext = jobTitle || clientName;
  const displayTitle = jobTitle || 'Driver Application';

  return (
    <header className="text-center mb-6 sm:mb-8">
      {/* Hero Logo - Centered above title */}
      {clientLogoUrl && (
        <div className="flex justify-center mb-4">
          <LogoAvatar size="2xl" className="shadow-md">
            <LogoAvatarImage src={clientLogoUrl} alt={`${clientName || 'Company'} logo`} />
          </LogoAvatar>
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 px-4">
        {displayTitle}
      </h1>
      
      {isExpressMode && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            ⚡ Quick Apply
          </span>
          <span className="text-xs text-muted-foreground">• Less than 1 minute</span>
        </div>
      )}
      
      {hasContext ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-muted-foreground text-base sm:text-sm px-4">
          {clientName && (
            <span className="inline-flex items-center gap-2">
              {!clientLogoUrl && (
                <Building2 className="h-4 w-4" aria-hidden="true" />
              )}
              {clientName}
            </span>
          )}
          {location && (
            <MetadataBadge icon={MapPin}>
              {location}
            </MetadataBadge>
          )}
          {source && (
            <MetadataBadge icon={Share2}>
              via {formatSource(source)}
            </MetadataBadge>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-base sm:text-sm px-4 leading-relaxed">
          Fill out the form below to apply for driving positions
        </p>
      )}
    </header>
  );
});

ApplicationHeader.displayName = 'ApplicationHeader';
