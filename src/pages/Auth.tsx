/**
 * Auth Page
 * Refactored with modular components for device-optimized authentication
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/common';
import {
  AuthContainer,
  SocialAuthButtons,
  UserTypeSelector,
  EmailField,
  PasswordField,
  RememberMeField,
  ConfirmPasswordField,
} from '@/features/auth/components';
import { useAuthForm } from '@/features/auth/hooks/useAuthForm';

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

  // Card title based on current mode
  const getCardTitle = () => {
    if (updatePasswordMode) return 'Update Password';
    if (resetMode) return 'Reset Password';
    if (signUpMode) return showUserTypeStep ? 'Choose Account Type' : 'Create Account';
    return 'Welcome Back';
  };

  // Card description based on current mode
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

  return (
    <AuthContainer>
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <Brand variant="horizontal" size="lg" showAsLink={false} />
        </div>
        <p className="text-sm text-muted-foreground">
          Next-Generation Applicant Tracking System
        </p>
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

          {/* Reset Sent Confirmation */}
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
              <Button
                variant="outline"
                onClick={resetPasswordResetFlow}
                className="min-h-[44px] touch-manipulation"
              >
                Back to Sign In
              </Button>
            </div>
          )}

          {/* Main Auth Forms */}
          {!updatePasswordMode && !resetSent && (
            <>
              {/* Reset Password Form */}
              {resetMode && (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <EmailField
                    value={email}
                    onChange={setEmail}
                    disabled={loading}
                  />
                  <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Instructions'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full min-h-[44px] touch-manipulation"
                    onClick={() => setResetMode(false)}
                  >
                    Back to Sign In
                  </Button>
                </form>
              )}

              {/* Sign Up Flow */}
              {!resetMode && signUpMode && (
                showUserTypeStep ? (
                  <UserTypeSelector
                    onSelect={handleUserTypeSelect}
                    onBack={() => setSignUpMode(false)}
                  />
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mb-2 -ml-2 min-h-[44px] touch-manipulation"
                      onClick={resetSignUpFlow}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Change account type
                    </Button>
                    <EmailField
                      value={email}
                      onChange={setEmail}
                      disabled={loading}
                    />
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

              {/* Sign In Form */}
              {!resetMode && !signUpMode && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <EmailField
                    value={email}
                    onChange={setEmail}
                    disabled={loading || oauthLoading !== null}
                  />
                  <PasswordField
                    value={password}
                    onChange={setPassword}
                    showPassword={showPassword}
                    onToggleShow={() => setShowPassword(!showPassword)}
                    disabled={loading || oauthLoading !== null}
                  />
                  <RememberMeField
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                  />
                  <Button
                    type="submit"
                    className="w-full min-h-[44px]"
                    disabled={loading || oauthLoading !== null}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <SocialAuthButtons
                    onOAuthSignIn={handleOAuthSignIn}
                    loading={loading}
                    oauthLoading={oauthLoading}
                    className="pt-2"
                  />

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 min-h-[44px] touch-manipulation text-sm"
                      onClick={() => setResetMode(true)}
                    >
                      Forgot password?
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 min-h-[44px] touch-manipulation text-sm"
                      onClick={() => setSignUpMode(true)}
                    >
                      Sign up
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </AuthContainer>
  );
};

export default Auth;
