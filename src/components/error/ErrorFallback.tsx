/**
 * Error Fallback UI Components
 * Provides user-friendly error displays with recovery options
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Bug, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/design-system/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/design-system/Card';
import { cn } from '@/lib/utils';
import type { ErrorFallbackProps, ErrorLevel } from '@/types/error.types';

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  componentStack,
  onRetry,
  onReport,
  onNavigateHome,
  onGoBack,
  level = 'error',
  showDetails = false,
  title,
  description,
  className,
  children
}) => {
  const [showStack, setShowStack] = React.useState(false);
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  const levelConfig = {
    warning: {
      icon: AlertTriangle,
      variant: 'warning' as const,
      iconColor: 'text-warning',
      title: title || 'Something went wrong',
      description: description || 'We encountered a minor issue, but you can continue.'
    },
    error: {
      icon: AlertTriangle,
      variant: 'destructive' as const,
      iconColor: 'text-destructive',
      title: title || 'An error occurred',
      description: description || 'Something unexpected happened. Please try again.'
    },
    critical: {
      icon: Bug,
      variant: 'destructive' as const,
      iconColor: 'text-destructive',
      title: title || 'Critical Error',
      description: description || 'A serious error occurred. Please contact support if this persists.'
    }
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  const errorDetails = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    errorId,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  const copyErrorDetails = async () => {
    const details = JSON.stringify(errorDetails, null, 2);
    try {
      await navigator.clipboard.writeText(details);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = details;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-4",
      className
    )}>
      <Card 
        variant="outline" 
        padding="lg" 
        className="max-w-lg w-full"
        status={level === 'warning' ? 'warning' : 'error'}
      >
        <CardHeader align="center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-muted">
            <Icon className={cn("h-8 w-8", config.iconColor)} />
          </div>
          <CardTitle level={2} size="lg">
            {config.title}
          </CardTitle>
          <p className="text-muted-foreground text-center">
            {config.description}
          </p>
          {errorId && (
            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              Error ID: {errorId}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {children && (
            <div className="mb-4">
              {children}
            </div>
          )}

          {showDetails && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                leftIcon={detailsExpanded ? ArrowLeft : Bug}
                fullWidth
              >
                {detailsExpanded ? 'Hide' : 'Show'} Technical Details
              </Button>

              {detailsExpanded && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium text-foreground mb-1">Error Message:</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {errorDetails.message}
                    </p>
                  </div>

                  {errorDetails.stack && (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowStack(!showStack)}
                      >
                        {showStack ? 'Hide' : 'Show'} Stack Trace
                      </Button>
                      
                      {showStack && (
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32 text-muted-foreground">
                          {errorDetails.stack}
                        </pre>
                      )}
                    </div>
                  )}

                  {componentStack && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">Component Stack:</p>
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32 text-muted-foreground">
                        {componentStack}
                      </pre>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyErrorDetails}
                    fullWidth
                  >
                    Copy Error Details
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter align="center">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {onRetry && (
              <Button
                variant="default"
                onClick={onRetry}
                leftIcon={RefreshCw}
                fullWidth
              >
                Try Again
              </Button>
            )}

            {onGoBack && (
              <Button
                variant="outline"
                onClick={onGoBack}
                leftIcon={ArrowLeft}
                fullWidth
              >
                Go Back
              </Button>
            )}

            {onNavigateHome && (
              <Button
                variant="ghost"
                onClick={onNavigateHome}
                leftIcon={Home}
                fullWidth
              >
                Go Home
              </Button>
            )}

            {onReport && level !== 'warning' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReport}
                leftIcon={Bug}
                fullWidth
              >
                Report Issue
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

// Specialized error fallback components
export const NetworkErrorFallback: React.FC<Omit<ErrorFallbackProps, 'level'>> = (props) => (
  <ErrorFallback
    {...props}
    level="error"
    title="Connection Error"
    description="Unable to connect to our servers. Please check your internet connection and try again."
  />
);

export const NotFoundErrorFallback: React.FC<Omit<ErrorFallbackProps, 'level'>> = (props) => (
  <ErrorFallback
    {...props}
    level="warning"
    title="Page Not Found"
    description="The page you're looking for doesn't exist or has been moved."
  />
);

export const PermissionErrorFallback: React.FC<Omit<ErrorFallbackProps, 'level'>> = (props) => (
  <ErrorFallback
    {...props}
    level="warning"
    title="Access Denied"
    description="You don't have permission to access this resource."
  />
);

export const ServerErrorFallback: React.FC<Omit<ErrorFallbackProps, 'level'>> = (props) => (
  <ErrorFallback
    {...props}
    level="critical"
    title="Server Error"
    description="Our servers are experiencing issues. Please try again later."
  />
);

// Minimal error fallback for small components
export const MinimalErrorFallback: React.FC<Pick<ErrorFallbackProps, 'error' | 'onRetry'>> = ({
  error,
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
    <AlertTriangle className="h-6 w-6 text-destructive" />
    <p className="text-sm text-muted-foreground">
      {error?.message || 'Something went wrong'}
    </p>
    {onRetry && (
      <Button variant="ghost" size="sm" onClick={onRetry} leftIcon={RefreshCw}>
        Retry
      </Button>
    )}
  </div>
);