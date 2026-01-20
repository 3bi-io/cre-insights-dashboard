import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

interface StatefulButtonProps extends Omit<ButtonProps, 'children'> {
  state?: ButtonState;
  idleContent: React.ReactNode;
  loadingContent?: React.ReactNode;
  successContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  /** Duration in ms to show success/error state before returning to idle */
  resetDelay?: number;
  onReset?: () => void;
}

export const StatefulButton: React.FC<StatefulButtonProps> = ({
  state = 'idle',
  idleContent,
  loadingContent,
  successContent,
  errorContent,
  resetDelay = 2000,
  onReset,
  disabled,
  className,
  ...props
}) => {
  React.useEffect(() => {
    if ((state === 'success' || state === 'error') && onReset) {
      const timer = setTimeout(() => {
        onReset();
      }, resetDelay);
      return () => clearTimeout(timer);
    }
  }, [state, resetDelay, onReset]);

  const getContent = () => {
    switch (state) {
      case 'loading':
        return loadingContent || (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        );
      case 'success':
        return successContent || (
          <>
            <Check className="mr-2 h-4 w-4" />
            Success!
          </>
        );
      case 'error':
        return errorContent || (
          <>
            <X className="mr-2 h-4 w-4" />
            Error
          </>
        );
      default:
        return idleContent;
    }
  };

  const getVariant = (): ButtonProps['variant'] => {
    if (state === 'success') return 'default';
    if (state === 'error') return 'destructive';
    return props.variant;
  };

  return (
    <Button
      {...props}
      variant={getVariant()}
      disabled={disabled || state === 'loading'}
      className={className}
    >
      {getContent()}
    </Button>
  );
};

export default StatefulButton;
