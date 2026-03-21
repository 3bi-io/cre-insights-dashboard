/**
 * Auth Page
 * Split layout - left branding panel, right auth card
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, ArrowLeft, Mic, Zap, Shield } from 'lucide-react';
import { Brand } from '@/components/common';
import { SEO } from '@/components/SEO';
import {
  SocialAuthButtons,
  UserTypeSelector,
  EmailField,
  PasswordField,
  RememberMeField,
  ConfirmPasswordField,
} from '@/features/auth/components';
import { useAuthForm } from '@/features/auth/hooks/useAuthForm';
import { Link } from 'react-router-dom';

const Auth = () => {
  const authForm = useAuthForm();

  const {
    email,
    password,
    loading,
    oauthLoading,
    error,
    resetMode,
    resetSent,
    updatePasswordMode,
    signUpMode,
    newPassword,
    confirmPassword,
    showPassword,
    showNewPassword,
    userTypeSelection,
    showUserTypeStep,
    rememberMe,
    setEmail,
    setPassword,
    setResetMode,
    setSignUpMode,
    setNewPassword,
    setConfirmPassword,
    setShowPassword,
    setShowNewPassword,
    setRememberMe,
    handleSignIn,
    handleSignUp,
    handlePasswordReset,
    handleUpdatePassword,
    handleOAuthSignIn,
    handleUserTypeSelect,
    resetSignUpFlow,
    resetPasswordResetFlow,
  } = authForm;

  const getCardTitle = () => {
    if (updatePasswordMode) return 'Update Password';
    if (resetMode) return 'Reset Password';
    if (signUpMode) return showUserTypeStep ? 'Choose Account Type' : 'Create Account';
    return 'Welcome Back';
  };

  const getCardDescription = () => {
    if (updatePasswordMode) return 'Enter your new password below';
    if (resetMode) return 'Enter your email to receive password reset instructions';
    if (signUpMode) {
      return showUserTypeStep
        ? 'Select how you want to use the platform'
        : `Creating ${userTypeSelection === 'organization' ? 'an Organization' : 'a Jobseeker'} account`;
    }
    return 'Sign in to your account to access the dashboard';
  };

  const features = [
    { icon: Mic, label: 'AI Voice Interviews', desc: 'Screen candidates 24/7 with intelligent voice agents' },
    { icon: Zap, label: 'Instant Callbacks', desc: 'Connect with candidates in under 3 minutes' },
    { icon: Shield, label: 'Enterprise Security', desc: 'SOC 2 compliant with end-to-end encryption' },
  ];

  return (
    <div className="min-h-screen flex">
      <SEO
        title={signUpMode ? "Sign Up | Create Your Account" : "Sign In | Access Your Dashboard"}
        description="Sign in to Apply AI to manage recruitment, track applications, and access AI-powered hiring tools."
        keywords="Apply AI login, recruiter sign in, candidate portal"
        canonical="https://applyai.jobs/auth"
      />

      {/* Left branding panel - hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary/20 via-background to-primary/5 border-r border-border flex-col justify-between p-10">
        <div>
          <Brand variant="horizontal" size="lg" showAsLink={true} />
          <div className="mt-16">
            <h2 className="text-3xl font-playfair font-bold text-foreground mb-3">
              Hire Smarter with AI
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-md">
              The most advanced AI-powered recruitment platform. Voice interviews, automated callbacks, and intelligent candidate management.
            </p>
            <div className="space-y-6">
              {features.map((feat) => (
                <div key={feat.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{feat.label}</p>
                    <p className="text-sm text-muted-foreground">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Apply AI. All rights reserved.
        </p>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm sm:max-w-md space-y-6">
          {/* Mobile-only logo */}
          <div className="text-center lg:hidden">
            <div className="flex items-center justify-center mb-4">
              <Brand variant="horizontal" size="lg" showAsLink={false} />
            </div>
            <p className="text-sm text-muted-foreground">AI-Powered Recruitment Platform</p>
          </div>

          {/* Auth Card */}
          <Card>
            <CardHeader className="space-y-1 px-4 sm:px-6 pt-4 sm:pt-6">
              <CardTitle className="text-xl sm:text-2xl">{getCardTitle()}</CardTitle>
              <CardDescription className="text-sm">{getCardDescription()}</CardDescription>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              {/* Update Password Mode */}
              {updatePasswordMode && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <PasswordField
                    id="newPassword"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    showPassword={showNewPassword}
                    onToggleShow={() => setShowNewPassword(!showNewPassword)}
                    disabled={loading}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    showStrength
                  />
                  <ConfirmPasswordField
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    showPassword={showNewPassword}
                    disabled={loading}
                  />
                  <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              )}

              {/* Reset Sent */}
              {!updatePasswordMode && resetSent && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Check your email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We've sent password reset instructions to {email}
                    </p>
                  </div>
                  <Button variant="outline" onClick={resetPasswordResetFlow} className="min-h-[44px]">
                    Back to Sign In
                  </Button>
                </div>
              )}

              {/* Main Auth Forms */}
              {!updatePasswordMode && !resetSent && (
                <>
                  {resetMode && (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <EmailField value={email} onChange={setEmail} disabled={loading} />
                      <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Instructions'}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full min-h-[44px]" onClick={() => setResetMode(false)}>
                        Back to Sign In
                      </Button>
                    </form>
                  )}

                  {!resetMode && signUpMode && (
                    showUserTypeStep ? (
                      <UserTypeSelector onSelect={handleUserTypeSelect} onBack={() => setSignUpMode(false)} />
                    ) : (
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <Button type="button" variant="ghost" size="sm" className="mb-2 -ml-2 min-h-[44px]" onClick={resetSignUpFlow}>
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          Change account type
                        </Button>
                        <EmailField value={email} onChange={setEmail} disabled={loading} />
                        <PasswordField
                          value={password}
                          onChange={setPassword}
                          showPassword={showPassword}
                          onToggleShow={() => setShowPassword(!showPassword)}
                          disabled={loading}
                          placeholder="Create a password (min 6 characters)"
                          autoComplete="new-password"
                        />
                        <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                          {loading ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </form>
                    )
                  )}

                  {!resetMode && !signUpMode && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <EmailField value={email} onChange={setEmail} disabled={loading || oauthLoading !== null} />
                      <PasswordField
                        value={password}
                        onChange={setPassword}
                        showPassword={showPassword}
                        onToggleShow={() => setShowPassword(!showPassword)}
                        disabled={loading || oauthLoading !== null}
                      />
                      <RememberMeField checked={rememberMe} onCheckedChange={setRememberMe} />
                      <Button type="submit" className="w-full min-h-[44px]" disabled={loading || oauthLoading !== null}>
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>

                      <SocialAuthButtons
                        onOAuthSignIn={handleOAuthSignIn}
                        loading={loading}
                        oauthLoading={oauthLoading}
                        className="pt-2"
                      />

                      <div className="flex items-center justify-between gap-2 pt-2">
                        <Button type="button" variant="ghost" className="flex-1 min-h-[44px] text-sm" onClick={() => setResetMode(true)}>
                          Forgot password?
                        </Button>
                        <Button type="button" variant="ghost" className="flex-1 min-h-[44px] text-sm" onClick={() => setSignUpMode(true)}>
                          Sign up
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* Error */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Terms fine print */}
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link to="/terms-of-service" className="underline hover:text-foreground">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
