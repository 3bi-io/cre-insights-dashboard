interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  isTrialing: boolean;
  loading: boolean;
}

/**
 * Subscription hook - all users now have full access
 * Subscription checks have been removed from the pricing model
 */
export const useSubscription = (): SubscriptionStatus => {
  return {
    hasActiveSubscription: true,
    subscriptionStatus: 'active',
    isTrialing: false,
    loading: false,
  };
};
