/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { errorService } from '@/services/errorService';
import type { ErrorBoundaryState, ErrorBoundaryProps } from '@/types/error.types';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorId = this.state.errorId || `error_${Date.now()}`;
    
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
      errorId
    });

    // Report error to service
    errorService.reportError(error, {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
      level: this.props.level || 'error',
      tags: this.props.tags,
      extra: {
        props: this.props.fallbackProps,
        ...this.props.extraData
      }
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo, errorId);
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
    
    this.props.onRetry?.();
  };

  private handleReport = (): void => {
    if (this.state.error && this.state.errorId) {
      errorService.reportError(this.state.error, {
        errorId: this.state.errorId,
        userReported: true,
        level: 'error'
      });
    }
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        return this.props.fallback(
          this.state.error,
          this.handleRetry,
          this.state.errorId
        );
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          componentStack={this.state.errorInfo?.componentStack}
          onRetry={this.handleRetry}
          onReport={this.handleReport}
          level={this.props.level}
          showDetails={this.props.showDetails}
          title={this.props.fallbackProps?.title}
          description={this.props.fallbackProps?.description}
        />
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for triggering error boundary from child components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    setError(errorObj);
  }, []);

  return { captureError };
}