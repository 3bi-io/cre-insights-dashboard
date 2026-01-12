import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface CandidateProfile {
  id: string;
  user_id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  city?: string;
  state?: string;
  zip?: string;
  resume_url?: string;
  headline?: string;
  summary?: string;
  desired_job_title?: string;
  profile_visibility?: string;
  open_to_opportunities?: boolean;
  profile_completion_percentage?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  userType: 'organization' | 'jobseeker' | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    subscription_status?: string;
    plan_type?: 'free' | 'starter' | 'professional' | 'enterprise';
  } | null;
  candidateProfile: CandidateProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userType?: 'organization' | 'jobseeker') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userType, setUserType] = useState<'organization' | 'jobseeker' | null>(null);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    subscription_status?: string;
    plan_type?: 'free' | 'starter' | 'professional' | 'enterprise';
  } | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRoleAndOrganization = async (_userId: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - STARTING for user:`, _userId.substring(0, 8) + '...');
    
    try {
      logger.info(`Fetching role and organization for user`, { userId: _userId });
      
      // Fetch user role
      console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - calling get_current_user_role RPC`);
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      
      if (roleError) {
        console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - RPC error:`, {
          message: roleError.message,
          code: roleError.code,
          details: roleError.details
        });
        logger.error('Error fetching user role', roleError);
        setUserRole('user');
      } else {
        console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - role fetched:`, roleData);
        logger.debug('User role fetched', { role: roleData });
        if (roleData === 'super_admin') {
          setUserRole('super_admin');
        } else {
          setUserRole((roleData as string) || 'user');
        }
      }

      // Fetch user's profile with organization and user_type
      console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - fetching profile with organization`);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          organization_id,
          user_type,
          organizations:organization_id(
            id,
            name,
            slug,
            logo_url,
            settings,
            subscription_status,
            plan_type
          )
        `)
        .eq('id', _userId)
        .maybeSingle();

      if (profileError) {
        console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - profile error:`, {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details
        });
        logger.error('Error fetching user profile', profileError);
        setOrganization(null);
        setUserType('organization');
      } else {
        // Set user type from database
        const dbUserType = (profileData as any)?.user_type as 'organization' | 'jobseeker' | null;
        setUserType(dbUserType || 'organization');
        console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - user_type:`, dbUserType);

        // Set organization
        if ((profileData as any)?.organizations) {
          console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - organization loaded:`, {
            name: (profileData as any).organizations.name,
            id: (profileData as any).organizations.id
          });
          logger.info('User organization loaded', { 
            orgName: (profileData as any).organizations.name,
            orgId: (profileData as any).organizations.id 
          });
          setOrganization((profileData as any).organizations as any);
        } else {
          console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - no organization found`);
          logger.debug('No organization found for user');
          setOrganization(null);
        }

        // Fetch candidate profile if user is a jobseeker
        if (dbUserType === 'jobseeker') {
          console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - fetching candidate profile`);
          const { data: candidateData, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', _userId)
            .maybeSingle();

          if (candidateError) {
            console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - candidate profile error:`, candidateError);
            logger.error('Error fetching candidate profile', candidateError);
            setCandidateProfile(null);
          } else if (candidateData) {
            console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - candidate profile loaded`);
            setCandidateProfile(candidateData as CandidateProfile);
          } else {
            console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - no candidate profile found`);
            setCandidateProfile(null);
          }
        } else {
          setCandidateProfile(null);
        }
      }
      
      console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - COMPLETED`);
    } catch (error: unknown) {
      console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - EXCEPTION:`, error);
      logger.error('Error fetching user data', error);
      setUserRole('user');
      setUserType('organization');
      setOrganization(null);
      setCandidateProfile(null);
    }
  };

  // Helper to clear all auth state
  const clearAuthState = () => {
    setSession(null);
    setUser(null);
    setUserRole(null);
    setUserType(null);
    setOrganization(null);
    setCandidateProfile(null);
  };

  // Helper to check if error is session expired
  const isSessionExpiredError = (error: Error | null) => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return message.includes('session_expired') || 
           message.includes('invalid refresh token') ||
           message.includes('refresh_token_not_found');
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.debug('Auth state changed', { event, hasSession: !!session });
        console.log('[AUTH] Auth state changed:', { event, hasSession: !!session });
        
        // Handle token refresh failure
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('[AUTH] Token refresh failed, clearing state');
          clearAuthState();
          // Also clear localStorage to prevent stale token issues
          try {
            localStorage.removeItem('supabase.auth.token');
          } catch (e) {
            console.error('[AUTH] Error clearing localStorage:', e);
          }
          setLoading(false);
          return;
        }

        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          console.log('[AUTH] User signed out, clearing state');
          clearAuthState();
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls to prevent deadlock
          setTimeout(() => {
            fetchUserRoleAndOrganization(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserType(null);
          setOrganization(null);
          setCandidateProfile(null);
        }
        
        setLoading(false);
        console.log('[AUTH] Loading complete');
      }
    );

    // Check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        console.log('[AUTH] Initial session check:', { hasSession: !!session, hasError: !!error });
        
        // Handle session expired errors gracefully
        if (error && isSessionExpiredError(error)) {
          console.log('[AUTH] Session expired on initial check, clearing state');
          logger.info('Session expired, user needs to re-authenticate');
          clearAuthState();
          // Clear localStorage to prevent future issues
          try {
            localStorage.removeItem('supabase.auth.token');
          } catch (e) {
            console.error('[AUTH] Error clearing localStorage:', e);
          }
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls to prevent deadlock
          setTimeout(() => {
            fetchUserRoleAndOrganization(session.user.id);
          }, 0);
        }
        
        setLoading(false);
        console.log('[AUTH] Initial load complete');
      })
      .catch((error) => {
        // Catch any unexpected errors during session check
        console.error('[AUTH] Unexpected error during session check:', error);
        logger.error('Unexpected error during session check', error);
        
        // Clear potentially corrupted state
        clearAuthState();
        try {
          localStorage.removeItem('supabase.auth.token');
        } catch (e) {
          console.error('[AUTH] Error clearing localStorage:', e);
        }
        
        setLoading(false);
      });

    // Session heartbeat - refresh every 7 hours (before 8-hour expiry)
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error: getError } = await supabase.auth.getSession();
        
        // If no session or error getting session, sign out
        if (getError || !session) {
          console.log('[AUTH] Session invalid during refresh check, signing out');
          logger.info('Session expired during heartbeat, signing out');
          await supabase.auth.signOut();
          return;
        }
        
        console.log('[AUTH] Refreshing session (7-hour heartbeat)');
        logger.info('Automatic session refresh triggered');
        
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log('[AUTH] Session refresh failed:', refreshError.message);
          if (isSessionExpiredError(refreshError)) {
            console.log('[AUTH] Session expired, signing out');
            await supabase.auth.signOut();
          }
        } else {
          console.log('[AUTH] Session refreshed successfully');
        }
      } catch (err) {
        console.error('[AUTH] Error during session refresh:', err);
      }
    }, 7 * 60 * 60 * 1000); // 7 hours in milliseconds

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH][${timestamp}] signIn - STARTING for:`, email.substring(0, 3) + '***');
    
    try {
      console.log(`[AUTH][${timestamp}] signIn - calling supabase.auth.signInWithPassword`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error(`[AUTH][${timestamp}] signIn - authentication error:`, {
          message: error.message,
          status: error.status,
          name: error.name
        });
        logger.error('Sign in error', error);
        return { error };
      }
      
      console.log(`[AUTH][${timestamp}] signIn - auth successful, session created:`, {
        hasSession: !!data.session,
        userId: data.session?.user?.id?.substring(0, 8) + '...',
        expiresAt: data.session?.expires_at
      });
      
      if (!data.session?.user) {
        const noSessionError = new Error('No session created');
        console.error(`[AUTH][${timestamp}] signIn - no session in response`);
        logger.error('Sign in failed - no session', {});
        return { error: noSessionError };
      }
      
      console.log(`[AUTH][${timestamp}] signIn - fetching user role and organization`);
      logger.info('Sign in successful, fetching user data');
      
      // Wait for role and organization to be fetched
      await fetchUserRoleAndOrganization(data.session.user.id);
      
      // Get user profile to determine navigation based on user_type
      console.log(`[AUTH][${timestamp}] signIn - fetching profile for navigation decision`);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.session.user.id)
        .maybeSingle();
      
      const userTypeFromDb = (profileData as any)?.user_type || 'organization';
      console.log(`[AUTH][${timestamp}] signIn - user_type from profile:`, userTypeFromDb);
      
      // Get role to determine navigation
      console.log(`[AUTH][${timestamp}] signIn - fetching role for navigation decision`);
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      
      if (roleError) {
        console.error(`[AUTH][${timestamp}] signIn - role fetch error:`, roleError);
        logger.error('Error fetching role for navigation', roleError);
      }
      
      const role = (roleData as string) || 'user';
      console.log(`[AUTH][${timestamp}] signIn - navigation decision:`, { role, userType: userTypeFromDb });
      logger.info('Navigation decision', { role, userType: userTypeFromDb });
      
      // Navigate based on role and user type
      let destination: string;
      if (role === 'super_admin') {
        destination = '/admin';
      } else if (userTypeFromDb === 'jobseeker') {
        destination = '/my-jobs';
      } else {
        destination = '/dashboard';
      }
      
      console.log(`[AUTH][${timestamp}] signIn - navigating to:`, destination);
      navigate(destination);
      
      console.log(`[AUTH][${timestamp}] signIn - COMPLETED successfully`);
      return { error: null };
    } catch (err) {
      console.error(`[AUTH][${timestamp}] signIn - EXCEPTION:`, err);
      logger.error('Unexpected error during sign in', err);
      const errorObj = err instanceof Error ? err : new Error('An unexpected error occurred during sign in');
      return { error: errorObj };
    }
  };

  const signUp = async (email: string, password: string, signUpUserType: 'organization' | 'jobseeker' = 'organization') => {
    const redirectUrl = signUpUserType === 'organization' 
      ? `${window.location.origin}/onboarding`
      : `${window.location.origin}/my-jobs/profile`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: signUpUserType
          }
        }
      });
      
      if (error) {
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Sign up failed');
      return { error: errorObj };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setUserType(null);
    setOrganization(null);
    setCandidateProfile(null);
    navigate('/');
  };

  const refreshUser = async () => {
    if (user?.id) {
      await fetchUserRoleAndOrganization(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userRole,
      userType,
      organization,
      candidateProfile,
      signIn,
      signUp,
      signOut,
      refreshUser,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};