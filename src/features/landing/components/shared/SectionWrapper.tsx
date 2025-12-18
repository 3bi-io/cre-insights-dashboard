/**
 * Reusable section wrapper with consistent spacing and container
 * Mobile-optimized with safe area insets
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  variant?: 'default' | 'muted' | 'gradient';
  id?: string;
}

export const SectionWrapper = ({ 
  children, 
  className, 
  containerClassName,
  variant = 'default',
  id 
}: SectionWrapperProps) => {
  const variantClasses = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    gradient: 'bg-gradient-to-br from-primary/10 via-background to-primary/5'
  };

  return (
    <section 
      id={id} 
      className={cn(
        'py-12 md:py-20',
        variantClasses[variant], 
        className
      )}
    >
      <div className={cn(
        'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
        // Safe area padding for notched devices
        'pl-[max(1rem,env(safe-area-inset-left))]',
        'pr-[max(1rem,env(safe-area-inset-right))]',
        containerClassName
      )}>
        {children}
      </div>
    </section>
  );
};
