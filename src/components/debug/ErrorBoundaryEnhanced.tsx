/**
 * Enhanced Error Boundary with Developer Tools Integration
 * Provides detailed error reporting and debugging capabilities in development
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  RefreshCw, 
  Copy, 
  Bug, 
  Code, 
  Clock,
  User,
  Globe,
  Smartphone
} from 'lucide-react';
import { devTools } from '@/utils/devTools';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetailedError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  private isDevMode = import.meta.env.DEV;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enhancedError = devTools.enhanceError(error, errorInfo.componentStack);
    
    this.setState({ errorInfo });
    
    // Log the error
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.state.retryCount,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error reporting service in production
    if (!this.isDevMode) {
      this.reportErrorToService(enhancedError, errorInfo);
    }
  }

  private async reportErrorToService(error: any, errorInfo: ErrorInfo) {
    try {
      // In a real app, you would send this to your error reporting service
      // like Sentry, Bugsnag, or your own API
      console.log('Would report to error service:', { error, errorInfo });
    } catch (reportingError) {
      logger.error('Failed to report error to service', { reportingError });
    }
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));

    logger.info('Error boundary retry attempted', { 
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1
    });
  };

  private handleCopyError = async () => {
    const errorReport = this.generateErrorReport();
    
    try {
      await navigator.clipboard.writeText(errorReport);
      // You might want to show a toast here
      logger.info('Error report copied to clipboard');
    } catch (err) {
      logger.error('Failed to copy error report', err);
    }
  };

  private generateErrorReport(): string {
    const { error, errorInfo, errorId } = this.state;
    
    return `
ERROR REPORT
============
ID: ${errorId}
Timestamp: ${new Date().toISOString()}
Environment: ${import.meta.env.MODE}

ERROR DETAILS:
${error?.message || 'Unknown error'}

STACK TRACE:
${error?.stack || 'No stack trace available'}

COMPONENT STACK:
${errorInfo?.componentStack || 'No component stack available'}

SYSTEM INFO:
- User Agent: ${navigator.userAgent}
- URL: ${window.location.href}
- Screen: ${screen.width}x${screen.height}
- Viewport: ${window.innerWidth}x${window.innerHeight}
- Connection: ${(navigator as any).connection?.effectiveType || 'unknown'}

RETRY COUNT: ${this.state.retryCount}
    `.trim();
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Development detailed error UI
      if (this.isDevMode && this.props.showDetailedError !== false) {
        return this.renderDetailedErrorUI();
      }

      // Production simple error UI
      return this.renderSimpleErrorUI();
    }

    return this.props.children;
  }

  private renderDetailedErrorUI() {
    const { error, errorInfo, errorId, retryCount } = this.state;

    return (
      <div className="min-h-screen bg-background p-4">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">
                  Development Error Boundary
                </CardTitle>
                <Badge variant="destructive">DEV</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleCopyError}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Report
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry {retryCount > 0 && `(${retryCount})`}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Summary */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2">
                <div className="space-y-1">
                  <div><strong>Message:</strong> {error?.message}</div>
                  <div><strong>Error ID:</strong> {errorId}</div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs">{new Date().toLocaleString()}</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* System Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">Browser</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {navigator.userAgent.split(' ').slice(-2).join(' ')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone className="w-4 h-4" />
                    <span className="font-medium">Viewport</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {window.innerWidth} × {window.innerHeight}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">Environment</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {import.meta.env.MODE}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Error Stack */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4" />
                <span className="font-medium">Stack Trace</span>
              </div>
              <ScrollArea className="h-48 w-full rounded border bg-muted p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {error?.stack || 'No stack trace available'}
                </pre>
              </ScrollArea>
            </div>

            {/* Component Stack */}
            {errorInfo?.componentStack && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4" />
                  <span className="font-medium">Component Stack</span>
                </div>
                <ScrollArea className="h-32 w-full rounded border bg-muted p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </ScrollArea>
              </div>
            )}

            <Separator />

            {/* Recovery Actions */}
            <div>
              <h4 className="font-medium mb-2">Recovery Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="justify-start"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="justify-start"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderSimpleErrorUI() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={this.handleRetry} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}