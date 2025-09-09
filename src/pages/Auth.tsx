
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const { signIn, user, userRole } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (userRole === 'super_admin') {
        window.location.href = '/admin';
      } else if (userRole === 'admin') {
        window.location.href = '/';
      } else {
        window.location.href = '/';
      }
    }
  }, [user, userRole]);

const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  const { error } = await signIn(email, password);
  if (error) {
    setError(error.message);
  }
  setLoading(false);
};

const handlePasswordReset = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?reset=true`,
    });
    
    if (error) throw error;
    
    setResetSent(true);
    toast({
      title: "Password reset sent",
      description: "Check your email for password reset instructions.",
    });
  } catch (error: any) {
    setError(error.message);
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img src="/intel-ats-logo.png" alt="INTEL ATS" className="w-20 h-20" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Next-Generation Applicant Tracking System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{resetMode ? 'Reset Password' : 'Welcome Back'}</CardTitle>
            <CardDescription>
              {resetMode 
                ? 'Enter your email to receive password reset instructions'
                : 'Sign in to your account to access the dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Check your email</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    We've sent password reset instructions to {email}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setResetSent(false);
                    setResetMode(false);
                    setEmail('');
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                {resetMode ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder="Enter your email" 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Reset Instructions'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => setResetMode(false)}
                    >
                      Back to Sign In
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder="Enter your email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        placeholder="Enter your password" 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => setResetMode(true)}
                    >
                      Forgot your password?
                    </Button>
                  </form>
                )}
              </>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
