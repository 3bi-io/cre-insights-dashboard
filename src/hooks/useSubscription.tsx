import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionStatus: string | null;
  isTrialing: boolean;
  loading: boolean;
}

export const useSubscription = (): SubscriptionStatus => {
  const { organization, user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasActiveSubscription: false,
    subscriptionStatus: null,
    isTrialing: false,
    loading: true,
  });

  useEffect(() => {
    const checkSubscription = async () => {
      if (!organization?.id) {
        setStatus({
          hasActiveSubscription: false,
          subscriptionStatus: null,
          isTrialing: false,
          loading: false,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('subscription_status')
          .eq('id', organization.id)
          .single();

        if (error) throw error;

        const subscriptionStatus = data?.subscription_status || 'inactive';
        const hasActiveSubscription = ['active', 'trialing'].includes(subscriptionStatus);
        const isTrialing = subscriptionStatus === 'trialing';

        setStatus({
          hasActiveSubscription,
          subscriptionStatus,
          isTrialing,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking subscription:', error);
        setStatus({
          hasActiveSubscription: false,
          subscriptionStatus: 'inactive',
          isTrialing: false,
          loading: false,
        });
      }
    };

    checkSubscription();
  }, [organization?.id, user]);

  return status;
};
