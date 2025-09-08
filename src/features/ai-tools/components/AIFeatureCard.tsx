import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, LucideIcon } from 'lucide-react';

interface AIFeatureCardProps {
  name: string;
  description: string;
  enabled: boolean;
  icon: LucideIcon;
  action: string;
  onAction?: () => void;
}

export const AIFeatureCard: React.FC<AIFeatureCardProps> = ({
  name,
  description,
  enabled,
  icon: Icon,
  action,
  onAction
}) => {
  return (
    <Card 
      className={`p-4 transition-colors ${
        enabled 
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20' 
          : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{name}</span>
              <Badge variant={enabled ? 'default' : 'secondary'}>
                {enabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          </div>
        </div>
        <Button 
          variant={enabled ? 'outline' : 'ghost'} 
          size="sm"
          disabled={!enabled}
          onClick={onAction}
        >
          <Settings className="w-4 h-4 mr-2" />
          {action}
        </Button>
      </div>
    </Card>
  );
};