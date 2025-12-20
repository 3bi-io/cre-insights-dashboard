import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail, Building2, Briefcase, ArrowLeft, Check, Eye, EyeOff, Github, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brand } from '@/components/common';
import { cn } from '@/lib/utils';

type UserType = 'organization' | 'jobseeker';
type OAuthProvider = 'google' | 'github';

// Google icon SVG component (Lucide doesn't have Google icon)
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, user, userRole, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userTypeSelection, setUserTypeSelection] = useState<UserType | null>(null);
  const [showUserTypeStep, setShowUserTypeStep] = useState(true);

  React.useEffect(() => {
    if (!authLoading && user) {
      if (userRole === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, authLoading, navigate]);

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
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid email or password')) {
        setError('Incorrect email or password.');
      } else if (errorMessage.includes('email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else {
        setError(error.message);
      }
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

    if (!userTypeSelection) {
      setError('Please select account type');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = userTypeSelection === 'organization' 
        ? `${window.location.origin}/onboarding`
        : `${window.location.origin}/my-jobs/profile`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: userTypeSelection
          }
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
      setUserTypeSelection(null);
      setShowUserTypeStep(true);
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) throw error;
    } catch (error: any) {
      const providerName = provider === 'google' ? 'Google' : 'GitHub';
      if (error.message?.includes('provider is not enabled')) {
        setError(`${providerName} sign-in is not configured. Please contact support or use email/password.`);
      } else {
        setError(error.message || `Failed to sign in with ${providerName}`);
      }
      setOauthLoading(null);
    }
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserTypeSelection(type);
    setShowUserTypeStep(false);
  };

  const resetSignUpFlow = () => {
    setShowUserTypeStep(true);
    setUserTypeSelection(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  // Social auth buttons component
  const SocialAuthButtons = ({ className }: { className?: string }) => (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or continue with</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading || oauthLoading !== null}
          className="w-full"
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          <span className="ml-2">Google</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthSignIn('github')}
          disabled={loading || oauthLoading !== null}
          className="w-full"
        >
          {oauthLoading === 'github' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Github className="h-4 w-4" />
          )}
          <span className="ml-2">GitHub</span>
        </Button>
      </div>
    </div>
  );

  const userTypeOptions = [
    {
      type: 'organization' as UserType,
      icon: Building2,
      title: 'Organization',
      description: 'Post jobs, manage applications, and hire top talent',
      features: ['Post unlimited job listings', 'Track applications', 'AI-powered candidate screening']
    },
    {
      type: 'jobseeker' as UserType,
      icon: Briefcase,
      title: 'Jobseeker',
      description: 'Find your next opportunity and track your applications',
      features: ['Search and apply for jobs', 'Track application status', 'Get job recommendations']
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Brand variant="horizontal" size="lg" showAsLink={false} />
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
                    ? (showUserTypeStep ? 'Choose Account Type' : 'Create Account')
                    : 'Welcome Back'}
            </CardTitle>
            <CardDescription>
              {updatePasswordMode
                ? 'Enter your new password below'
                : resetMode 
                  ? 'Enter your email to receive password reset instructions'
                  : signUpMode
                    ? (showUserTypeStep 
                        ? 'Select how you want to use the platform' 
                        : `Creating ${userTypeSelection === 'organization' ? 'an Organization' : 'a Jobseeker'} account`)
                    : 'Sign in to your account to access the dashboard'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {updatePasswordMode ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input 
                      id="newPassword" 
                      type={showNewPassword ? "text" : "password"} 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                      placeholder="Enter new password" 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="space-y-1">
                      <Progress 
                        value={Math.min(100, (newPassword.length / 12) * 100)} 
                        className="h-1"
                      />
                      <p className="text-xs text-muted-foreground">
                        {newPassword.length < 6 ? 'Weak' : newPassword.length < 10 ? 'Medium' : 'Strong'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type={showNewPassword ? "text" : "password"} 
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
                  <p className="text-sm text-muted-foreground mt-1">
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
                  showUserTypeStep ? (
                    <div className="space-y-4">
                      {userTypeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.type}
                            type="button"
                            onClick={() => handleUserTypeSelect(option.type)}
                            className={cn(
                              "w-full p-4 rounded-lg border-2 text-left transition-all hover:border-primary hover:bg-accent/50",
                              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="w-6 h-6 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{option.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                                <ul className="mt-3 space-y-1">
                                  {option.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Check className="w-3 h-3 text-primary" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => setSignUpMode(false)}
                      >
                        Already have an account? Sign in
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        className="mb-2 -ml-2"
                        onClick={resetSignUpFlow}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Change account type
                      </Button>
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
                        {loading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  )
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
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          required 
                          placeholder="Enter your password" 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || oauthLoading !== null}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                    
                    <SocialAuthButtons className="pt-2" />
                    
                    <div className="flex items-center justify-between gap-2 pt-2">
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