import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard } from 'lucide-react';

interface SubscriptionGateProps {
  children: React.ReactNode;
  feature?: string;
  mode?: 'block' | 'warn';
}

const SubscriptionGate: React.FC<SubscriptionGateProps> = ({ 
  children, 
  feature = 'this feature',
  mode = 'warn'
}) => {
  const { userRole } = useAuth();
  const { hasActiveSubscription, loading } = useSubscription();

  // Super admins bypass subscription checks
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // Still loading subscription status
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No active subscription
  if (!hasActiveSubscription) {
    if (mode === 'block') {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertTitle>Subscription Required</AlertTitle>
            <AlertDescription className="space-y-4">
              <p>
                You need an active subscription to access {feature}. 
                Choose a plan that fits your needs.
              </p>
              <Button asChild className="w-full">
                <Link to="/pricing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  View Pricing Plans
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // Warn mode - show banner but allow viewing
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Subscription Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Upgrade to access all features and create new content.</span>
            <Button asChild size="sm" variant="outline">
              <Link to="/pricing">Upgrade Now</Link>
            </Button>
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGate;
