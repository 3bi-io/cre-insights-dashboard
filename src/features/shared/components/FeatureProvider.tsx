import React, { createContext, useContext, ReactNode } from 'react';
import { BaseFeatureConfig, FeatureError } from '../types/feature.types';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';

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
  const organizationFeatures = useOrganizationFeatures();

  const hasFeatureAccess = (featureName: string): boolean => {
    try {
      const accessMethod = organizationFeatures[`has${featureName}Access` as keyof typeof organizationFeatures];
      if (typeof accessMethod === 'function') {
        return (accessMethod as () => boolean)();
      }
      return false;
    } catch (error) {
      console.warn(`Feature access check failed for ${featureName}:`, error);
      return false;
    }
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