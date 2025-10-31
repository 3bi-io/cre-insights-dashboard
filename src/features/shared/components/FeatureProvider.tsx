import React, { createContext, useContext, ReactNode } from 'react';
import { BaseFeatureConfig, FeatureError } from '../types/feature.types';
import { useAuth } from '@/hooks/useAuth';

interface FeatureContextValue {
  hasFeatureAccess: (featureName: string) => boolean;
  reportFeatureError: (error: FeatureError) => void;
  isFeatureEnabled: (config: BaseFeatureConfig) => boolean;
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

export interface FeatureProviderProps {
  children: ReactNode;
}

export const FeatureProvider: React.FC<FeatureProviderProps> = ({ children }) => {
  const { userRole } = useAuth();

  const hasFeatureAccess = (featureName: string): boolean => {
    // Super admins have access to all features
    if (userRole === 'super_admin') return true;
    
    // For now, return false for non-super-admins
    // This can be enhanced later with proper feature flags
    return false;
  };

  const reportFeatureError = (error: FeatureError): void => {
    console.error(`Feature Error [${error.feature}]:`, error);
    
    // You could also send to analytics or error reporting service here
    // analytics.track('feature_error', { feature: error.feature, code: error.code });
  };

  const isFeatureEnabled = (config: BaseFeatureConfig): boolean => {
    if (!config.enabled) return false;
    
    if (config.organizationFeature && !hasFeatureAccess(config.organizationFeature)) {
      return false;
    }

    // Add more checks as needed (user permissions, etc.)
    return true;
  };

  const value: FeatureContextValue = {
    hasFeatureAccess,
    reportFeatureError,
    isFeatureEnabled
  };

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatureContext = (): FeatureContextValue => {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatureContext must be used within a FeatureProvider');
  }
  return context;
};