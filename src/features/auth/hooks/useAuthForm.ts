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
  const { signIn, user, userRole, loading: authLoading } = useAuth();
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

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && user) {
      if (userRole === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, userRole, authLoading, navigate]);

  // Check for password reset mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      setUpdatePasswordMode(true);
    }
  }, []);

  // Handle session cleanup when browser closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      const shouldRemember = localStorage.getItem('rememberMe') === 'true';
      if (!shouldRemember) {
        sessionStorage.setItem('sessionActive', 'true');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const sessionActive = sessionStorage.getItem('sessionActive');
    const shouldRemember = localStorage.getItem('rememberMe') === 'true';
    
    if (!sessionActive && !shouldRemember && !authLoading) {
      if (user) {
        supabase.auth.signOut();
      }
    }
    
    sessionStorage.setItem('sessionActive', 'true');

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, authLoading]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    localStorage.setItem('rememberMe', rememberMe.toString());
    
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
      const providerNames: Record<OAuthProvider, string> = {
        google: 'Google',
        github: 'GitHub',
        apple: 'Apple',
        linkedin_oidc: 'LinkedIn',
        azure: 'Microsoft',
        twitter: 'X'
      };
      const providerName = providerNames[provider];
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
