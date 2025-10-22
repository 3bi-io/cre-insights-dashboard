
import React from 'react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brand } from '@/components/common';

const Auth = () => {
  const { signIn, user, userRole, organization } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  React.useEffect(() => {
    if (user && organization) {
      if (userRole === 'super_admin') {
        window.location.href = '/admin';
      } else if (organization.subscription_status === 'inactive') {
        window.location.href = '/onboarding';
      } else if (organization.subscription_status === 'active' || organization.subscription_status === 'trialing') {
        // Only redirect to dashboard if subscription is active or trialing
        window.location.href = '/dashboard';
      }
      // If subscription is neither inactive nor active (e.g., null/undefined), stay on auth page
    }
  }, [user, userRole, organization]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      setUpdatePasswordMode(true);
    }
  }, []);

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

const handleUpdatePassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  
  if (newPassword !== confirmPassword) {
    setError('Passwords do not match');
    setLoading(false);
    return;
  }

  if (newPassword.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) throw error;
    
    toast({
      title: "Password updated",
      description: "Your password has been successfully updated. Please sign in.",
    });
    
    setUpdatePasswordMode(false);
    setNewPassword('');
    setConfirmPassword('');
    window.history.replaceState({}, '', '/auth');
  } catch (error: any) {
    setError(error.message || 'Failed to update password. The reset link may have expired.');
  }
  setLoading(false);
};

const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  try {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    if (error) throw error;
    
    toast({
      title: "Account created successfully",
      description: "Please check your email to verify your account.",
    });
    
    setEmail('');
    setPassword('');
    setSignUpMode(false);
  } catch (error: any) {
    if (error.message?.includes('already registered')) {
      setError('This email is already registered. Please sign in instead.');
    } else {
      setError(error.message);
    }
  }
  setLoading(false);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Brand size="xl" showAsLink={false} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Next-Generation Applicant Tracking System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {updatePasswordMode 
                ? 'Update Password' 
                : resetMode 
                  ? 'Reset Password' 
                  : signUpMode 
                    ? 'Create Account' 
                    : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {updatePasswordMode
                ? 'Enter your new password below'
                : resetMode 
                  ? 'Enter your email to receive password reset instructions'
                  : signUpMode
                    ? 'Sign up to create your account and get started'
                    : 'Sign in to your account to access the dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updatePasswordMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    placeholder="Enter new password" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    placeholder="Confirm new password" 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            ) : resetSent ? (
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
                ) : signUpMode ? (
                  <form onSubmit={handleSignUp} className="space-y-4">
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
                        placeholder="Create a password (min 6 characters)" 
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating account...' : 'Sign Up'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full" 
                      onClick={() => setSignUpMode(false)}
                    >
                      Already have an account? Sign in
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
                    <div className="flex items-center justify-between gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="flex-1" 
                        onClick={() => setResetMode(true)}
                      >
                        Forgot password?
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="flex-1" 
                        onClick={() => setSignUpMode(true)}
                      >
                        Sign up
                      </Button>
                    </div>
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
