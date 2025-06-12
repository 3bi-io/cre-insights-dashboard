
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description?: string;
}

const MetricsCard = ({ title, value, change, changeType, icon: Icon, description }: MetricsCardProps) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground'
  }[changeType];

  const changeBgColor = {
    positive: 'bg-green-50 border-green-200',
    negative: 'bg-red-50 border-red-200',
    neutral: 'bg-muted border-border'
  }[changeType];

  return (
    <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-200 hover:border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            <div className={`px-2 py-1 rounded-md border text-xs font-semibold ${changeBgColor} ${changeColor}`}>
              {change}
            </div>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="bg-primary/10 p-3 rounded-lg ml-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
