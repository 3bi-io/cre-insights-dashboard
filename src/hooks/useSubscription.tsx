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
    // Wait for auth to finish loading
    if (authLoading) {
      setStatus(prev => ({ ...prev, loading: true }));
      return;
    }

    // If no organization, user has no subscription
    if (!organization) {
      setStatus({
        hasActiveSubscription: false,
        subscriptionStatus: null,
        isTrialing: false,
        loading: false,
      });
      return;
    }

    // Use the subscription_status from the organization object (already loaded by useAuth)
    const subscriptionStatus = organization.subscription_status || 'inactive';
    const hasActiveSubscription = ['active', 'trialing'].includes(subscriptionStatus);
    const isTrialing = subscriptionStatus === 'trialing';

    setStatus({
      hasActiveSubscription,
      subscriptionStatus,
      isTrialing,
      loading: false,
    });
  }, [organization, authLoading]);

  return status;
};
