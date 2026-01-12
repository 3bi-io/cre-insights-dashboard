import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, LogIn } from 'lucide-react';
import { clearAuthState, isAuthError } from '@/utils/authRecovery';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isAuthRelatedError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isAuthRelatedError: false };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isAuthRelated = isAuthError(error);
    return { hasError: true, error, isAuthRelatedError: isAuthRelated };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const isAuthRelated = isAuthError(error);
    
    logger.error('GlobalErrorBoundary caught an error', { 
      error, 
      errorInfo, 
      isAuthRelated 
    }, 'ErrorBoundary');
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ error, errorInfo, isAuthRelatedError: isAuthRelated });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, isAuthRelatedError: false });
  };

  private handleClearSessionAndSignIn = () => {
    // Clear all auth state
    clearAuthState();
    // Navigate to auth page
    window.location.href = '/auth';
  };

  private handleClearSessionAndRetry = () => {
    // Clear all auth state
    clearAuthState();
    // Reload the page
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Check if this is an auth-related error
      if (this.state.isAuthRelatedError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LogIn className="h-6 w-6 text-primary" />
                  <CardTitle>Session Expired</CardTitle>
                </div>
                <CardDescription>
                  Your session has expired or is no longer valid. Please sign in again to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Button onClick={this.handleClearSessionAndSignIn} className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In Again
                  </Button>
                  <Button variant="outline" onClick={this.handleClearSessionAndRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Session & Retry
                  </Button>
                  <Button variant="ghost" onClick={this.handleGoHome} className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Default error UI for non-auth errors
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button variant="ghost" onClick={this.handleGoHome} className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default GlobalErrorBoundary;