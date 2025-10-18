import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalErrorBoundary from "@/components/error/GlobalErrorBoundary";
import { ErrorBoundaryEnhanced } from "@/components/debug/ErrorBoundaryEnhanced";
import { DevToolsPanel, DevToolsToggle } from "@/components/debug/DevToolsPanel";
import { FeatureProvider } from "@/features/shared/components/FeatureProvider";
import { logger } from "@/services/loggerService";
import AppRoutes from "@/components/routing/AppRoutes";
import CountryBlockWrapper from "@/components/CountryBlockWrapper";

// Optimized QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});

const App = React.memo(() => {
  const [showDevTools, setShowDevTools] = useState(false);
  
  return (
    <ErrorBoundaryEnhanced showDetailedError={true}>
      <GlobalErrorBoundary
        onError={(error, errorInfo) => {
          logger.error('App-level error caught', { error, errorInfo }, 'App');
        }}
      >
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system" storageKey="ui-theme">
            <BrowserRouter>
              <AuthProvider>
                <FeatureProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    
                    <CountryBlockWrapper>
                      <AppRoutes />
                    </CountryBlockWrapper>
                    
                    {/* Development Tools */}
                    <DevToolsToggle onToggle={() => setShowDevTools(!showDevTools)} />
                    <DevToolsPanel 
                      isVisible={showDevTools} 
                      onToggle={() => setShowDevTools(!showDevTools)} 
                    />
                  </TooltipProvider>
                </FeatureProvider>
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </ErrorBoundaryEnhanced>
  );
});

App.displayName = "App";

export default App;