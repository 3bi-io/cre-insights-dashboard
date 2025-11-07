/**
 * Reusable card component for features with icons
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

export const IconFeatureCard = ({ 
  icon: Icon, 
  title, 
  description,
  className 
}: IconFeatureCardProps) => {
  return (
    <Card className={cn(
      'hover:shadow-lg transition-all duration-300 border-muted hover:border-primary/20',
      className
    )}>
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};
