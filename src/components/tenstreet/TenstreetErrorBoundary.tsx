import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface TenstreetErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TenstreetErrorBoundary extends React.Component<
  { children: React.ReactNode },
  TenstreetErrorBoundaryState
> {
  state: TenstreetErrorBoundaryState = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error): TenstreetErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Tenstreet Error Boundary caught error', error, { componentStack: errorInfo.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tenstreet Integration Error</AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
