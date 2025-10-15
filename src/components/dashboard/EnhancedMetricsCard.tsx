import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface EnhancedMetricsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  comparison?: {
    current: number;
    previous: number;
    period: string;
  };
}

export const EnhancedMetricsCard: React.FC<EnhancedMetricsCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  comparison,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend.value < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-green-600 bg-green-50';
    if (trend.value < 0) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const calculateChange = () => {
    if (!comparison) return null;
    const change = comparison.current - comparison.previous;
    const percentChange = comparison.previous > 0 
      ? ((change / comparison.previous) * 100).toFixed(1)
      : '0';
    return { change, percentChange };
  };

  const changeData = calculateChange();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          {trend && (
            <Badge className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-xs font-medium">{Math.abs(trend.value)}%</span>
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>

          {changeData && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className={`text-xs font-medium ${
                changeData.change > 0 ? 'text-green-600' : 
                changeData.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {changeData.change > 0 ? '+' : ''}{changeData.percentChange}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs {comparison.period}
              </span>
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
