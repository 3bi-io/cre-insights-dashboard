import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StepContainerProps {
  children: React.ReactNode;
  direction: 'forward' | 'backward';
  isActive: boolean;
  className?: string;
  autoFocus?: boolean;
  scrollToTop?: boolean;
  ariaLabel?: string;
}

export const StepContainer = ({ 
  children, 
  direction, 
  isActive,
  className,
  autoFocus = true,
  scrollToTop = true,
  ariaLabel,
}: StepContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef(isActive);

  useEffect(() => {
    // Only run effects when becoming active (not on initial render if already active)
    if (isActive && !previousActiveRef.current) {
      // Scroll to top of container
      if (scrollToTop && containerRef.current) {
        containerRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }

      // Auto-focus first focusable element
      if (autoFocus && containerRef.current) {
        requestAnimationFrame(() => {
          const focusable = containerRef.current?.querySelector<HTMLElement>(
            'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
          );
          focusable?.focus();
        });
      }
    }
    previousActiveRef.current = isActive;
  }, [isActive, autoFocus, scrollToTop]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={ariaLabel}
      aria-live="polite"
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
