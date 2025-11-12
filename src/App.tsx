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
import { initSentry } from "@/lib/sentry";
import AppRoutes from "@/components/routing/AppRoutes";
import CountryBlockWrapper from "@/components/CountryBlockWrapper";
import { usePageTracking } from "@/hooks/usePageTracking";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useEffect } from "react";

// Initialize Sentry error monitoring
initSentry();

// Service Worker Registration
function PWAUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      logger.debug('Service Worker registered', { scope: r?.scope });
    },
    onRegisterError(error) {
      logger.error('Service Worker registration failed', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Automatically update service worker when new version is available
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}

// Optimized QueryClient configuration with performance-focused caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes (formerly cacheTime)
      
      // Retry logic - smart retry based on error type
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = error.status as number;
          if (status >= 400 && status < 500) return false;
        }
        // Don't retry auth errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error.message as string).toLowerCase();
          if (message.includes('auth') || message.includes('unauthorized')) return false;
        }
        return failureCount < 2;
      },
      
      // Performance settings
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: true, // Refetch on component mount
      refetchInterval: false, // No automatic polling by default
      
      // Network settings
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      networkMode: 'online',
    },
  },
});

const AppContent = () => {
  // Initialize page tracking
  usePageTracking();
  
  return (
    <CountryBlockWrapper>
      <AppRoutes />
      <PWAInstallPrompt />
      <PWAUpdater />
      <AIChatbot />
    </CountryBlockWrapper>
  );
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