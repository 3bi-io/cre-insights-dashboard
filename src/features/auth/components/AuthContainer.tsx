/**
 * Auth Container
 * Responsive container with safe area support for native apps
 */

import { ReactNode } from 'react';
import { getSafeAreaClasses } from '@/utils/mobileOptimizations';
import { cn } from '@/lib/utils';

interface AuthContainerProps {
  children: ReactNode;
  className?: string;
}

export function AuthContainer({ children, className }: AuthContainerProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center bg-background",
        // Responsive padding
        "py-8 px-4 sm:py-12 sm:px-6 lg:px-8",
        // Safe area insets for notched devices
        getSafeAreaClasses(),
        className
      )}
    >
      <div className={cn(
        "w-full space-y-6 sm:space-y-8",
        // Responsive max-width
        "max-w-sm sm:max-w-md"
      )}>
        {children}
      </div>
    </div>
  );
}
