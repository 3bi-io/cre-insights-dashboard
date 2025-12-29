import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, AlertCircle, Briefcase, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import type { OAuthProvider } from '../hooks/useAuthForm';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  
  // Sign-up state
  const [userType, setUserType] = useState<'organization' | 'jobseeker'>('organization');
  const [showUserTypeSelection, setShowUserTypeSelection] = useState(false);
  // Sign-in state
  const [signInUserType, setSignInUserType] = useState<'organization' | 'jobseeker'>('organization');
  const [showSignInForm, setShowSignInForm] = useState(false);
  
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
    } else {
      navigate('/');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signUp(email, password, userType);
    
    if (error) {
      setError(error.message);
    } else {
      // Redirect based on user type
      navigate(userType === 'jobseeker' ? '/my-jobs' : '/');
    }
    
    setIsLoading(false);
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
      setError(error.message || `Failed to sign in with ${provider}`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">ATS.me</h1>
          <p className="text-muted-foreground">Next-Generation Applicant Tracking System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" onClick={() => { setShowSignInForm(false); setError(''); }}>Sign In</TabsTrigger>
                <TabsTrigger value="signup" onClick={() => { setShowUserTypeSelection(false); setError(''); }}>Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                {!showSignInForm ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Choose your account type to sign in
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-accent"
                        onClick={() => {
                          setSignInUserType('organization');
                          setShowSignInForm(true);
                        }}
                      >
                        <Briefcase className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-semibold">Employer</div>
                          <div className="text-xs text-muted-foreground">Sign in to manage recruitment</div>
                        </div>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-accent"
                        onClick={() => {
                          setSignInUserType('jobseeker');
                          setShowSignInForm(true);
                        }}
                      >
                        <UserCircle className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-semibold">Jobseeker</div>
                          <div className="text-xs text-muted-foreground">Sign in to track your applications</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSignInForm(false)}
                      >
                        ← Back
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {signInUserType === 'organization' ? 'Employer Account' : 'Jobseeker Account'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                        Remember me
                      </Label>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    {/* Social Auth */}
                    <SocialAuthButtons
                      onOAuthSignIn={handleOAuthSignIn}
                      loading={isLoading}
                      oauthLoading={oauthLoading}
                    />

                    {/* Footer Links */}
                    <div className="flex items-center justify-center gap-4 text-sm pt-2">
                      <Link to="/auth?reset=true" className="text-primary hover:underline">
                        Forgot password?
                      </Link>
                      <span className="text-muted-foreground">|</span>
                      <button
                        type="button"
                        className="text-primary hover:underline"
                        onClick={() => {
                          setShowSignInForm(false);
                          const signupTab = document.querySelector('[value="signup"]') as HTMLButtonElement;
                          signupTab?.click();
                        }}
                      >
                        Sign up
                      </button>
                    </div>
                  </form>
                )}
              </TabsContent>
              
              <TabsContent value="signup">
                {!showUserTypeSelection ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Choose your account type to get started
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-accent"
                        onClick={() => {
                          setUserType('organization');
                          setShowUserTypeSelection(true);
                        }}
                      >
                        <Briefcase className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-semibold">I'm hiring talent</div>
                          <div className="text-xs text-muted-foreground">Post jobs and manage applicants</div>
                        </div>
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto py-6 flex flex-col items-center gap-2 hover:bg-accent"
                        onClick={() => {
                          setUserType('jobseeker');
                          setShowUserTypeSelection(true);
                        }}
                      >
                        <UserCircle className="h-8 w-8 text-primary" />
                        <div>
                          <div className="font-semibold">I'm looking for work</div>
                          <div className="text-xs text-muted-foreground">Find jobs and track applications</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUserTypeSelection(false)}
                      >
                        ← Back
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {userType === 'organization' ? 'Employer Account' : 'Jobseeker Account'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>

                    {/* Social Auth */}
                    <SocialAuthButtons
                      onOAuthSignIn={handleOAuthSignIn}
                      loading={isLoading}
                      oauthLoading={oauthLoading}
                    />
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-primary hover:underline text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
