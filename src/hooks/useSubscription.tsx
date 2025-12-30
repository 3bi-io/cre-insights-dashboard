import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  isTrialing: boolean;
  loading: boolean;
}

export const useSubscription = (): SubscriptionStatus => {
  const { organization, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    subscriptionStatus: null,
    isTrialing: false,
    loading: true,
  });

  useEffect(() => {
    console.log('[SUBSCRIPTION] Checking subscription status:', { authLoading, hasOrg: !!organization, organization: organization?.name });
    
    // Wait for auth to finish loading
    if (authLoading) {
      setStatus(prev => ({ ...prev, loading: true }));
      return;
    }

    // If no organization yet but user exists, keep loading - organization may still be fetching
    // This prevents premature "no subscription" determination before org data arrives
    if (!organization) {
      console.log('[SUBSCRIPTION] No organization found yet - may still be loading');
      setStatus({
        hasActiveSubscription: false,
        subscriptionStatus: null,
        isTrialing: false,
        loading: false, // Let ProtectedRoute handle the org loading check
      });
      return;
    }

    // Use the subscription_status from the organization object (already loaded by useAuth)
    const subscriptionStatus = organization.subscription_status || 'inactive';
    const hasActiveSubscription = ['active', 'trialing'].includes(subscriptionStatus);
    const isTrialing = subscriptionStatus === 'trialing';

    console.log('[SUBSCRIPTION] Status determined:', { subscriptionStatus, hasActiveSubscription, isTrialing });

    setStatus({
      hasActiveSubscription,
      subscriptionStatus,
      isTrialing,
      loading: false,
    });
  }, [organization, authLoading]);

  return status;
};
