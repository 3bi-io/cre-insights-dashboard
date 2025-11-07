/**
 * Reusable statistic display card
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export const StatCard = ({ 
  value, 
  label, 
  description,
  icon: Icon,
  className 
}: StatCardProps) => {
  return (
    <div className={cn('text-center', className)}>
      {Icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      )}
      <div className="text-3xl md:text-4xl font-bold text-primary mb-2 font-playfair">
        {value}
      </div>
      <div className={cn('text-muted-foreground', description && 'font-semibold text-foreground mb-1')}>
        {label}
      </div>
      {description && (
        <div className="text-sm text-muted-foreground">{description}</div>
      )}
    </div>
  );
};
