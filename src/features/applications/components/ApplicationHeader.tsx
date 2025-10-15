import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, Loader2 } from 'lucide-react';
import { formatPhoneForDisplay } from '@/utils/phoneNormalizer';

interface ApplicationHeaderProps {
  applicantName: string;
  jobTitle: string;
  status: string;
  displayCity?: string;
  displayState?: string;
  isLookingUp?: boolean;
  zipCode?: string;
  phone?: string;
  statusColors: Record<string, string>;
}

export const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  applicantName,
  jobTitle,
  status,
  displayCity,
  displayState,
  isLookingUp,
  zipCode,
  phone,
  statusColors,
}) => {
  const formatLocation = () => {
    if (displayCity && displayState) {
      return `${displayCity}, ${displayState}`;
    } else if (displayCity) {
      return displayCity;
    } else if (displayState) {
      return displayState;
    } else if (isLookingUp && zipCode) {
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Looking up...
        </div>
      );
    } else {
      return 'No location provided';
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-semibold text-lg truncate text-foreground group-hover:text-primary transition-colors">
            {applicantName}
          </h3>
          <Badge 
            className={`shrink-0 ${statusColors[status as keyof typeof statusColors] || statusColors.pending}`}
          >
            {status}
          </Badge>
        </div>
        
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span className="font-medium text-foreground truncate">{jobTitle}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{formatLocation()}</span>
          </div>
          
          {phone && (
            <div className="flex items-center gap-2">
              <span className="text-xs">📞</span>
              <span className="truncate">{formatPhoneForDisplay(phone)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
