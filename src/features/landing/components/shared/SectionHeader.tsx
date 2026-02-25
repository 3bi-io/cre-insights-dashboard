/**
 * Reusable section header with title and description
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

export const SectionHeader = ({ 
  title, 
  description, 
  badge,
  align = 'center',
  className 
}: SectionHeaderProps) => {
  const alignClasses = align === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn(alignClasses, 'mb-16', className)}>
      {badge && <div className="mb-4">{badge}</div>}
      <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
};
