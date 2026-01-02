import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles } from 'lucide-react';

const BillingSettings = () => {
  const { organization } = useAuth();

  const allFeatures = [
    'Unlimited job listings',
    'AI-powered candidate screening',
    'Advanced analytics & reporting',
    'ATS integrations (Tenstreet, DriverReach)',
    'Meta advertising integration',
    'Voice agent capabilities',
    'Background check integrations',
    'Custom branding',
    'Priority support',
    'API access',
  ];

  return (
    <div className="container max-w-2xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Plan & Features</h1>
        <p className="text-muted-foreground">Your organization has access to all features</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Full Access Plan
            </CardTitle>
            <CardDescription>
              {organization?.name || 'Your Organization'} has access to all platform features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {allFeatures.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingSettings;
