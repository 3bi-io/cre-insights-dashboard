import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const BillingSettings = () => {
  const { organization } = useAuth();

  const subscriptionStatus = organization?.subscription_status || 'inactive';
  const planType = organization?.plan_type || 'free';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'trialing':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'past_due':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPlanFeatures = (plan: string) => {
    const features: Record<string, string[]> = {
      free: ['5 job listings', 'Basic analytics', 'Email support'],
      starter: ['25 job listings', 'Advanced analytics', 'Priority email support', 'ATS integrations'],
      professional: ['Unlimited job listings', 'AI-powered screening', 'Phone support', 'Custom integrations'],
      enterprise: ['Everything in Professional', 'Dedicated account manager', 'Custom features', 'SLA guarantee']
    };
    return features[plan] || features.free;
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Your current subscription status and plan details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold capitalize">{planType} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {organization?.name || 'Your Organization'}
                </p>
              </div>
              <Badge className={getStatusColor(subscriptionStatus)}>
                {subscriptionStatus === 'active' ? 'Active' : 
                 subscriptionStatus === 'trialing' ? 'Trial' :
                 subscriptionStatus === 'past_due' ? 'Past Due' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Plan Features</p>
              <ul className="space-y-1">
                {getPlanFeatures(planType).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2">
              <Button asChild>
                <Link to="/pricing">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Plans
                </Link>
              </Button>
              {subscriptionStatus === 'active' && (
                <Button variant="outline">
                  Manage Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Your saved payment methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment method on file</p>
              <Button variant="outline" className="mt-4">
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSettings;