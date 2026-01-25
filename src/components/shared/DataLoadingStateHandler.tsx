import React from 'react';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyStateMessage } from './EmptyStateMessage';
import { useDataLoadingState } from '@/hooks/useDataLoadingState';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface DataLoadingStateHandlerProps<T> {
  // Query state
  data: T | undefined | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  refetch?: () => void;

  // Empty state customization
  emptyCheck?: (data: T) => boolean;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void } | { label: string; href: string };

  // Loading customization
  loadingComponent?: React.ReactNode;
  loadingMessage?: string;
  skeletonCount?: number;
  skeletonClassName?: string;

  // Error customization
  showErrorToast?: boolean;
  errorTitle?: string;
  errorDescription?: string;

  // Data label for messages
  dataLabel?: string;

  // Container styling
  className?: string;

  // Content when data is available
  children: (data: T) => React.ReactNode;
}

/**
 * Default loading skeleton component
 */
const DefaultLoadingSkeleton: React.FC<{
  count?: number;
  className?: string;
  message?: string;
}> = ({ count = 3, className, message }) => (
  <div 
    className="flex flex-col items-center justify-center py-12 space-y-4"
    role="status"
    aria-label={message || 'Loading content'}
  >
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    {message && (
      <p className="text-sm text-muted-foreground">{message}</p>
    )}
    <div className="w-full max-w-md space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-16 w-full", className)} />
      ))}
    </div>
  </div>
);

/**
 * Error state component with retry button
 */
const ErrorState: React.FC<{
  title?: string;
  description: string;
  onRetry?: () => void;
}> = ({ title = 'Something went wrong', description, onRetry }) => (
  <Alert variant="destructive" className="my-6" role="alert">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription className="flex flex-col gap-3">
      <span>{description}</span>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="w-fit"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      )}
    </AlertDescription>
  </Alert>
);

/**
 * A wrapper component that handles loading, error, and empty states
 * for data-fetching pages. Provides consistent UI feedback across the app.
 * 
 * @example
 * ```tsx
 * <DataLoadingStateHandler
 *   data={campaigns}
 *   isLoading={isLoading}
 *   isError={isError}
 *   refetch={refetch}
 *   dataLabel="campaigns"
 *   emptyTitle="No campaigns yet"
 *   emptyDescription="Create your first campaign to get started"
 *   emptyAction={{ label: 'Create Campaign', onClick: () => setShowDialog(true) }}
 * >
 *   {(data) => data.map(c => <CampaignCard key={c.id} campaign={c} />)}
 * </DataLoadingStateHandler>
 * ```
 */
export function DataLoadingStateHandler<T>({
  data,
  isLoading,
  isError,
  error,
  refetch,
  emptyCheck,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  loadingComponent,
  loadingMessage,
  skeletonCount = 3,
  skeletonClassName,
  showErrorToast = true,
  errorTitle,
  errorDescription,
  dataLabel = 'data',
  className,
  children,
}: DataLoadingStateHandlerProps<T>) {
  const loadingState = useDataLoadingState({
    data,
    isLoading,
    isError,
    error,
    refetch,
    emptyCheck,
    dataLabel,
    showErrorToast,
  });

  // Loading state
  if (loadingState.state === 'loading') {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }
    return (
      <div className={className}>
        <DefaultLoadingSkeleton
          count={skeletonCount}
          className={skeletonClassName}
          message={loadingMessage}
        />
      </div>
    );
  }

  // Error state
  if (loadingState.state === 'error') {
    return (
      <div className={className}>
        <ErrorState
          title={errorTitle}
          description={errorDescription || loadingState.errorMessage}
          onRetry={refetch ? loadingState.retry : undefined}
        />
      </div>
    );
  }

  // Empty state
  if (loadingState.state === 'empty') {
    const actionProps = emptyAction
      ? 'onClick' in emptyAction
        ? { actionLabel: emptyAction.label, onAction: emptyAction.onClick }
        : { actionLabel: emptyAction.label, actionHref: emptyAction.href }
      : {};

    return (
      <div className={className}>
        <EmptyStateMessage
          icon={emptyIcon}
          title={emptyTitle || `No ${dataLabel} found`}
          description={emptyDescription}
          {...actionProps}
        />
      </div>
    );
  }

  // Success state - render children with data
  return <div className={className}>{children(loadingState.data as T)}</div>;
}

export default DataLoadingStateHandler;
