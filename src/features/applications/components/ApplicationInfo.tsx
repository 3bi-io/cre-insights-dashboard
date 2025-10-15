import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ApplicationInfoProps {
  appliedAt?: string;
  source?: string;
  category?: string;
  clientName?: string;
  applicantEmail?: string;
}

export const ApplicationInfo: React.FC<ApplicationInfoProps> = ({
  appliedAt,
  source,
  category,
  clientName,
  applicantEmail,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {appliedAt && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(appliedAt), 'MMM dd, yyyy')}</span>
          </div>
        )}
        
        {source && (
          <Badge variant="outline" className="bg-background/50">
            {source}
          </Badge>
        )}
        
        {category && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {category}
          </Badge>
        )}
        
        {clientName && (
          <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground">
            {clientName}
          </Badge>
        )}
      </div>
      
      {applicantEmail && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <a 
            href={`mailto:${applicantEmail}`}
            className="hover:text-primary transition-colors truncate"
          >
            {applicantEmail}
          </a>
        </div>
      )}
    </div>
  );
};
