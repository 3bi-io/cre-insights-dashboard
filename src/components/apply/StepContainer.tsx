import React from 'react';
import { cn } from '@/lib/utils';

interface StepContainerProps {
  children: React.ReactNode;
  direction: 'forward' | 'backward';
  isActive: boolean;
  className?: string;
}

export const StepContainer = ({ 
  children, 
  direction, 
  isActive,
  className 
}: StepContainerProps) => {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "animate-in duration-300 ease-out",
        direction === 'forward' 
          ? "slide-in-from-right-4 fade-in" 
          : "slide-in-from-left-4 fade-in",
        className
      )}
    >
      {children}
    </div>
  );
};
