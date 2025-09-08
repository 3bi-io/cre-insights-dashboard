import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ExternalLink, Settings } from 'lucide-react';

interface QuickDomainActionsProps {
  organization: any;
  onOpenDomainSettings: () => void;
}

const QuickDomainActions: React.FC<QuickDomainActionsProps> = ({ 
  organization, 
  onOpenDomainSettings 
}) => {
  const getDomainStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-green-500 text-green-700 bg-green-50';
      case 'pending': return 'border-yellow-500 text-yellow-700 bg-yellow-50';
      case 'failed': return 'border-red-500 text-red-700 bg-red-50';
      default: return 'border-gray-500 text-gray-700 bg-gray-50';
    }
  };

  if (!organization.domain) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Not configured</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenDomainSettings}
          className="text-xs"
        >
          <Settings className="w-3 h-3 mr-1" />
          Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">{organization.domain}</span>
        {organization.domain_status === 'active' && organization.domain_deployed_at && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs p-1 h-auto"
          >
            <a
              href={`https://${organization.domain}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`text-xs ${getDomainStatusColor(organization.domain_status || 'pending')}`}
        >
          <Globe className="w-3 h-3 mr-1" />
          {organization.domain_status || 'pending'}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenDomainSettings}
          className="text-xs p-1 h-auto"
        >
          <Settings className="w-3 h-3" />
        </Button>
      </div>
      {organization.domain_ssl_status && (
        <div className="text-xs text-muted-foreground">
          SSL: {organization.domain_ssl_status}
        </div>
      )}
    </div>
  );
};

export default QuickDomainActions;