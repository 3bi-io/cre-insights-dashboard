import { useAuth } from './useAuth';

/**
 * Hook to check plan-based feature access
 */
export const usePlanFeatures = () => {
  const { organization, userRole } = useAuth();

  // Super admins bypass all restrictions
  if (userRole === 'super_admin') {
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
  }

  const planType = organization?.plan_type || 'free';

  return {
    isEnterprise: planType === 'enterprise',
    isProfessional: planType === 'professional' || planType === 'enterprise',
    isStarter: planType !== 'free',
    hasUnlimitedUsers: planType === 'enterprise',
    hasUnlimitedJobs: planType === 'enterprise' || planType === 'professional',
    hasPrioritySupport: planType === 'enterprise',
    hasCustomBranding: planType === 'enterprise' || planType === 'professional',
    hasAdvancedAnalytics: planType !== 'free',
    hasApiAccess: planType === 'enterprise',
    planType,
  };
};
