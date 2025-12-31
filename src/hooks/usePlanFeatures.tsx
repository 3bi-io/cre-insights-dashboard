/**
 * Hook for plan-based feature access
 * All users now have full access to all features
 */
export const usePlanFeatures = () => {
  return {
    isEnterprise: true,
    isProfessional: true,
    isStarter: true,
    hasUnlimitedUsers: true,
    hasUnlimitedJobs: true,
    hasPrioritySupport: true,
    hasCustomBranding: true,
    hasAdvancedAnalytics: true,
    hasApiAccess: true,
    planType: 'enterprise' as const,
  };
};
