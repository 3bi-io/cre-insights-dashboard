/**
 * Auth Form Hook
 * Extracted form state and logic for authentication flows
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type UserType = 'organization' | 'jobseeker';
export type OAuthProvider = 'google' | 'github' | 'apple' | 'linkedin_oidc' | 'azure' | 'twitter';

export interface UseAuthFormReturn {
  // State
  email: string;
  password: string;
  loading: boolean;
  oauthLoading: OAuthProvider | null;
  error: string;
  resetMode: boolean;
  resetSent: boolean;
  updatePasswordMode: boolean;
  signUpMode: boolean;
  newPassword: string;
  confirmPassword: string;
  showPassword: boolean;
  showNewPassword: boolean;
  userTypeSelection: UserType | null;
  showUserTypeStep: boolean;
  rememberMe: boolean;
  
  // Setters
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string) => void;
  setResetMode: (mode: boolean) => void;
  setSignUpMode: (mode: boolean) => void;
  setNewPassword: (password: string) => void;
  setConfirmPassword: (password: string) => void;
  setShowPassword: (show: boolean) => void;
  setShowNewPassword: (show: boolean) => void;
  setRememberMe: (remember: boolean) => void;
  
  // Handlers
  handleSignIn: (e: React.FormEvent) => Promise<void>;
  handleSignUp: (e: React.FormEvent) => Promise<void>;
  handlePasswordReset: (e: React.FormEvent) => Promise<void>;
  handleUpdatePassword: (e: React.FormEvent) => Promise<void>;
  handleOAuthSignIn: (provider: OAuthProvider) => Promise<void>;
  handleUserTypeSelect: (type: UserType) => void;
  resetSignUpFlow: () => void;
  resetPasswordResetFlow: () => void;
}

export function useAuthForm(): UseAuthFormReturn {
  const navigate = useNavigate();
  const { signIn, user, userRole, userType, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState('');
  
  // Mode state
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // User type state
  const [userTypeSelection, setUserTypeSelection] = useState<UserType | null>(null);
  const [showUserTypeStep, setShowUserTypeStep] = useState(true);
  
  // Remember me
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });

  // Redirect authenticated users - wait for both user AND role to be loaded
  useEffect(() => {
    // Wait for auth to be fully loaded
    if (authLoading) return;
    if (!user) return;
    // userRole is null while loading, wait for it to be set (even if to 'user')
    if (userRole === null) {
      console.log('[AUTH_FORM] Waiting for userRole to be loaded...');
      return;
    }
    
    console.log('[AUTH_FORM] Redirecting authenticated user:', { userRole, userType });
    
    if (userRole === 'super_admin') {
      navigate('/admin', { replace: true });
    } else if (userType === 'jobseeker') {
      navigate('/my-jobs', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [user, userRole, userType, authLoading, navigate]);

  // Check for password reset mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      setUpdatePasswordMode(true);
    }
  }, []);

  // Remember me preference is stored but session management is handled by Supabase
  // The session heartbeat in useAuth.tsx handles automatic refresh

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    console.log(`[AUTH_FORM][${timestamp}] handleSignIn - form submitted for:`, email.substring(0, 3) + '***');
    
    setLoading(true);
    setError('');
    
    localStorage.setItem('rememberMe', rememberMe.toString());
    console.log(`[AUTH_FORM][${timestamp}] handleSignIn - calling signIn from useAuth`);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      console.error(`[AUTH_FORM][${timestamp}] handleSignIn - error received:`, {
        message: error.message,
        name: error.name
      });
      
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid email or password')) {
        setError('Incorrect email or password.');
      } else if (errorMessage.includes('email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else {
        setError(error.message);
      }
    } else {
      console.log(`[AUTH_FORM][${timestamp}] handleSignIn - sign in successful`);
    }
    
    setLoading(false);
    console.log(`[AUTH_FORM][${timestamp}] handleSignIn - completed`);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const timestamp = new Date().toISOString();
    console.log(`[AUTH_FORM][${timestamp}] handlePasswordReset - requesting reset for:`, email.substring(0, 3) + '***');
    
    setLoading(true);
    setError('');
    
    try {
      console.log(`[AUTH_FORM][${timestamp}] handlePasswordReset - calling supabase.auth.resetPasswordForEmail`);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });
      
      if (error) {
        console.error(`[AUTH_FORM][${timestamp}] handlePasswordReset - error:`, error);
        throw error;
      }
      
      console.log(`[AUTH_FORM][${timestamp}] handlePasswordReset - reset email sent successfully`);
      setResetSent(true);
      toast({
        title: "Password reset sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      console.error(`[AUTH_FORM][${timestamp}] handlePasswordReset - caught error:`, error.message);
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
    const timestamp = new Date().toISOString();
    console.log(`[AUTH_FORM][${timestamp}] handleSignUp - form submitted for:`, email.substring(0, 3) + '***');
    
    setLoading(true);
    setError('');

    if (password.length < 6) {
      console.log(`[AUTH_FORM][${timestamp}] handleSignUp - validation failed: password too short`);
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!userTypeSelection) {
      console.log(`[AUTH_FORM][${timestamp}] handleSignUp - validation failed: no user type selected`);
      setError('Please select account type');
      setLoading(false);
      return;
    }

    console.log(`[AUTH_FORM][${timestamp}] handleSignUp - userType:`, userTypeSelection);

    try {
      const redirectUrl = userTypeSelection === 'organization' 
        ? `${window.location.origin}/onboarding`
        : `${window.location.origin}/my-jobs/profile`;
      
      console.log(`[AUTH_FORM][${timestamp}] handleSignUp - calling supabase.auth.signUp with redirectUrl:`, redirectUrl);
      
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
      
      if (error) {
        console.error(`[AUTH_FORM][${timestamp}] handleSignUp - error from supabase:`, error);
        throw error;
      }
      
      console.log(`[AUTH_FORM][${timestamp}] handleSignUp - account created successfully`);
      
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
      console.error(`[AUTH_FORM][${timestamp}] handleSignUp - caught error:`, error.message);
      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
    console.log(`[AUTH_FORM][${timestamp}] handleSignUp - completed`);
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH_FORM][${timestamp}] handleOAuthSignIn - provider:`, provider);
    
    setOauthLoading(provider);
    setError('');
    
    try {
      console.log(`[AUTH_FORM][${timestamp}] handleOAuthSignIn - calling supabase.auth.signInWithOAuth`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      
      if (error) {
        console.error(`[AUTH_FORM][${timestamp}] handleOAuthSignIn - error:`, error);
        throw error;
      }
      
      console.log(`[AUTH_FORM][${timestamp}] handleOAuthSignIn - OAuth redirect initiated`);
    } catch (error: any) {
      const providerNames: Record<OAuthProvider, string> = {
        google: 'Google',
        github: 'GitHub',
        apple: 'Apple',
        linkedin_oidc: 'LinkedIn',
        azure: 'Microsoft',
        twitter: 'X'
      };
      const providerName = providerNames[provider];
      console.error(`[AUTH_FORM][${timestamp}] handleOAuthSignIn - caught error for ${providerName}:`, error.message);
      
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

  const resetPasswordResetFlow = () => {
    setResetSent(false);
    setResetMode(false);
    setEmail('');
  };

  return {
    // State
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
    
    // Setters
    setEmail,
    setPassword,
    setError,
    setResetMode,
    setSignUpMode,
    setNewPassword,
    setConfirmPassword,
    setShowPassword,
    setShowNewPassword,
    setRememberMe,
    
    // Handlers
    handleSignIn,
    handleSignUp,
    handlePasswordReset,
    handleUpdatePassword,
    handleOAuthSignIn,
    handleUserTypeSelect,
    resetSignUpFlow,
    resetPasswordResetFlow,
  };
}
