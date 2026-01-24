import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';

interface AnalyticsEmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'brain' | 'trending' | 'chart';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const AnalyticsEmptyState: React.FC<AnalyticsEmptyStateProps> = ({
  title = 'No Analytics Data Available',
  description = 'Start analyzing candidates to see AI-powered insights and performance metrics.',
  icon = 'brain',
  action,
  className = '',
}) => {
  const IconComponent = {
    brain: Brain,
    trending: TrendingUp,
    chart: BarChart3,
  }[icon];

  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <IconComponent className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsEmptyState;
