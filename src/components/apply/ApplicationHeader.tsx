import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2, Share2 } from 'lucide-react';

interface ApplicationHeaderProps {
  jobTitle?: string | null;
  organizationName?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  source?: string | null;
  isLoading?: boolean;
}

// Format source for display (e.g., 'x' -> 'X', 'facebook' -> 'Facebook')
const formatSource = (source: string): string => {
  const sourceMap: Record<string, string> = {
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
  return sourceMap[source.toLowerCase()] || source.charAt(0).toUpperCase() + source.slice(1);
};

export const ApplicationHeader = ({ 
  jobTitle, 
  organizationName, 
  location, 
  logoUrl,
  source,
  isLoading = false 
}: ApplicationHeaderProps) => {
  if (isLoading) {
    return (
      <div className="text-center mb-6 sm:mb-8">
        <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-5 w-48 mx-auto" />
      </div>
    );
  }

  const hasContext = jobTitle || organizationName;

  return (
    <div className="text-center mb-6 sm:mb-8">
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt={organizationName || 'Company logo'} 
          className="h-16 w-auto mx-auto mb-4 object-contain"
        />
      )}
      
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 px-4">
        {jobTitle || 'Driver Application'}
      </h1>
      
      {hasContext ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-muted-foreground text-base sm:text-sm px-4">
          {organizationName && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {organizationName}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
          )}
          {source && (
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              via {formatSource(source)}
            </span>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-base sm:text-sm px-4 leading-relaxed">
          Fill out the form below to apply for driving positions
        </p>
      )}
    </div>
  );
};
