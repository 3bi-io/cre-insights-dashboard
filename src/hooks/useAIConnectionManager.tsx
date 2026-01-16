import { useState, useEffect, useCallback } from 'react';
import { aiConnectionManager, AIConnectionStatus, AIProvider } from '@/services/aiConnectionManager';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';

export const useAIConnectionManager = () => {
  const [connectionStatuses, setConnectionStatuses] = useState<AIConnectionStatus[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  const updateStatuses = useCallback(() => {
    setConnectionStatuses(aiConnectionManager.getAllConnectionStatuses());
  }, []);

  const checkSingleConnection = useCallback(async (provider: AIProvider) => {
    try {
      const status = await aiConnectionManager.checkConnection(provider);
      updateStatuses();
      return status;
    } catch (error) {
      logger.error(`Failed to check ${provider} connection`, error);
      return null;
    }
  }, [updateStatuses]);

  const refreshAllConnections = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await aiConnectionManager.refreshAllConnections();
      updateStatuses();
      
      const health = aiConnectionManager.getHealthSummary();
      toast({
        title: "AI Connections Refreshed",
        description: `${health.connectedProviders}/${health.totalProviders} providers connected (${health.healthPercentage.toFixed(0)}% health)`,
      });
    } catch (error) {
      logger.error('Failed to refresh AI connections', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh AI platform connections",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [updateStatuses, toast]);

  const startMonitoring = useCallback((intervalMs?: number) => {
    aiConnectionManager.startPeriodicChecks(intervalMs);
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    aiConnectionManager.stopPeriodicChecks();
    setIsMonitoring(false);
  }, []);

  const getHealthSummary = useCallback(() => {
    return aiConnectionManager.getHealthSummary();
  }, []);

  const getRecommendedProvider = useCallback(() => {
    return aiConnectionManager.getRecommendedProvider();
  }, []);

  const updateProviderConfig = useCallback((provider: AIProvider, config: any) => {
    aiConnectionManager.updateProviderConfig(provider, config);
  }, []);

  // Initialize on mount
  useEffect(() => {
    refreshAllConnections();
    
    // Cleanup on unmount
    return () => {
      stopMonitoring();
    };
  }, [refreshAllConnections, stopMonitoring]);

  return {
    connectionStatuses,
    isRefreshing,
    isMonitoring,
    checkSingleConnection,
    refreshAllConnections,
    startMonitoring,
    stopMonitoring,
    getHealthSummary,
    getRecommendedProvider,
    updateProviderConfig,
  };
};