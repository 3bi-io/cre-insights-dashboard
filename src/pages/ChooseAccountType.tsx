import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, UserCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const ChooseAccountType = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'organization' | 'jobseeker' | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { user, userType, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Check if user already has a type set, redirect if so
  useEffect(() => {
    const checkUserType = async () => {
      if (!user) {
        // Not logged in, redirect to auth
        navigate('/auth');
        return;
      }

      // Fetch current user_type from database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching profile', error, { context: 'choose-account-type' });
        setCheckingStatus(false);
        return;
      }

      // If user already has a type, redirect to appropriate dashboard
      if (profile?.user_type) {
        if (profile.user_type === 'jobseeker') {
          navigate('/my-jobs');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      setCheckingStatus(false);
    };

    checkUserType();
  }, [user, navigate]);

  const handleSelectType = async (type: 'organization' | 'jobseeker') => {
    if (!user) return;
    
    setIsLoading(true);
    setSelectedType(type);

    try {
      // Update the user's profile with the selected type
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: type })
        .eq('id', user.id);

      if (error) throw error;

      // If jobseeker, create a candidate profile
      if (type === 'jobseeker') {
        const { error: candidateError } = await supabase
          .from('candidate_profiles')
          .upsert({
            user_id: user.id,
            email: user.email,
          }, { onConflict: 'user_id' });

        if (candidateError) {
          logger.error('Error creating candidate profile', candidateError, { context: 'choose-account-type' });
        }
      }

      // Refresh auth context
      await refreshUser();

      toast.success('Account type saved!');

      // Redirect based on type
      if (type === 'jobseeker') {
        navigate('/my-jobs/profile');
      } else {
        navigate('/onboarding');
      }
    } catch (error: any) {
      logger.error('Error updating user type', error, { context: 'choose-account-type' });
      toast.error('Failed to save account type. Please try again.');
      setIsLoading(false);
      setSelectedType(null);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Apply AI</h1>
          <p className="text-muted-foreground">Welcome! Let's get you set up.</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Choose Your Account Type</CardTitle>
            <CardDescription>
              Select how you'll be using Apply AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-center gap-2 hover:bg-accent hover:border-primary transition-colors"
              onClick={() => handleSelectType('organization')}
              disabled={isLoading}
            >
              {isLoading && selectedType === 'organization' ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <Briefcase className="h-8 w-8 text-primary" />
              )}
              <div>
                <div className="font-semibold">I'm hiring talent</div>
                <div className="text-xs text-muted-foreground">Post jobs and manage applicants</div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-auto py-6 flex flex-col items-center gap-2 hover:bg-accent hover:border-primary transition-colors"
              onClick={() => handleSelectType('jobseeker')}
              disabled={isLoading}
            >
              {isLoading && selectedType === 'jobseeker' ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <UserCircle className="h-8 w-8 text-primary" />
              )}
              <div>
                <div className="font-semibold">I'm looking for work</div>
                <div className="text-xs text-muted-foreground">Find jobs and track applications</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChooseAccountType;
