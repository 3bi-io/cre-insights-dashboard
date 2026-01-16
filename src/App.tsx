import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalErrorBoundary from "@/components/error/GlobalErrorBoundary";
import { FeatureProvider } from "@/features/shared/components/FeatureProvider";
import { logger } from "@/lib/logger";
import AppRoutes from "@/components/routing/AppRoutes";
import { usePageTracking } from "@/hooks/usePageTracking";
import { cleanupCorruptedAuthState } from "@/utils/authRecovery";

// Proactively clean up corrupted auth state on app startup
// This runs before React renders to prevent crashes from stale tokens
try {
  const wasCleared = cleanupCorruptedAuthState();
  if (wasCleared) {
    logger.warn('Corrupted auth state was detected and cleared on startup', { context: 'APP' });
  } else {
    logger.debug('Auth state is clean, no cleanup needed', { context: 'APP' });
  }
} catch (e) {
  logger.error('Error during auth cleanup', e, { context: 'APP' });
}

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

const AppContent = () => {
  // Initialize page tracking
  usePageTracking();
  
  return <AppRoutes />;
};

const App = React.memo(() => {
  return (
    <GlobalErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('App-level error caught', error, { errorInfo, component: 'App' });
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
                  <AppContent />
                </TooltipProvider>
              </FeatureProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = "App";

export default App;