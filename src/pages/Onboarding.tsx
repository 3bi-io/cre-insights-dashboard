import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, Building2 } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationSlug: '',
  });

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create organization
      const { data: orgData, error: orgError } = await supabase
        .rpc('create_organization', {
          _name: formData.organizationName,
          _slug: formData.organizationSlug,
          _admin_email: user?.email,
        });

      if (orgError) throw orgError;

      // Refresh user to get organization data
      await refreshUser();

      toast({
        title: 'Organization created',
        description: 'Your organization has been set up successfully.',
      });

      setStep(2);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToPricing = () => {
    navigate('/pricing');
  };

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to RecruiterPro</CardTitle>
            <CardDescription>
              Let's set up your organization to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOrgSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  placeholder="Acme Recruiting"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationSlug">Organization Slug</Label>
                <Input
                  id="organizationSlug"
                  placeholder="acme-recruiting"
                  value={formData.organizationSlug}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    organizationSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') 
                  })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in your organization's URL
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Choose pricing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
          <CardDescription>
            Select a pricing plan to activate your organization and start recruiting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            You'll be redirected to our pricing page to select and activate your subscription.
          </p>
          <Button onClick={handleSkipToPricing} className="w-full">
            View Pricing Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
