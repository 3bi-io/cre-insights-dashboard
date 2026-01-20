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

// Valid roles in the system
const VALID_ROLES = ['super_admin', 'admin', 'moderator', 'recruiter', 'user'] as const;
type ValidRole = typeof VALID_ROLES[number];

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
  } | null;
  candidateProfile: CandidateProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userType?: 'organization' | 'jobseeker') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  isOrgAdmin: boolean;
  isSuperAdmin: boolean;
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
  } | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRoleAndOrganization = async (_userId: string) => {
    const FETCH_TIMEOUT = 10000;
    logger.log('fetchUserRoleAndOrganization - starting', { userId: _userId.substring(0, 8) });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Role fetch timeout')), FETCH_TIMEOUT);
    });

    const fetchLogic = async () => {
      logger.log('Fetching role and profile in parallel', { context: 'AUTH' });
      
      const [roleResult, profileResult] = await Promise.all([
        supabase.rpc('get_current_user_role'),
        supabase
          .from('profiles')
          .select(`
            organization_id,
            user_type,
            organizations:organization_id(
              id,
              name,
              slug,
              logo_url,
              settings
            )
          `)
          .eq('id', _userId)
          .maybeSingle()
      ]);

      // Process role with explicit validation
      if (roleResult.error) {
        logger.error('Error fetching user role', roleResult.error, { context: 'AUTH' });
        setUserRole('user');
      } else {
        const fetchedRole = roleResult.data as string;
        const normalizedRole: ValidRole = (VALID_ROLES as readonly string[]).includes(fetchedRole) 
          ? (fetchedRole as ValidRole) 
          : 'user';
        logger.log('Role fetched', { 
          raw: fetchedRole, 
          normalized: normalizedRole,
          isOrgAdmin: normalizedRole === 'admin',
          isSuperAdmin: normalizedRole === 'super_admin',
          context: 'AUTH'
        });
        setUserRole(normalizedRole);
      }

      // Process profile
      if (profileResult.error) {
        logger.error('Error fetching user profile', profileResult.error, { context: 'AUTH' });
        setOrganization(null);
        setUserType('organization');
      } else {
        const dbUserType = (profileResult.data as any)?.user_type as 'organization' | 'jobseeker' | null;
        setUserType(dbUserType || 'organization');
        logger.log('User type loaded', { userType: dbUserType, context: 'AUTH' });

        if ((profileResult.data as any)?.organizations) {
          logger.log('Organization loaded', { context: 'AUTH' });
          setOrganization((profileResult.data as any).organizations as any);
        } else {
          setOrganization(null);
        }

        // Fetch candidate profile if jobseeker
        if (dbUserType === 'jobseeker') {
          logger.log('Fetching candidate profile', { context: 'AUTH' });
          const { data: candidateData, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', _userId)
            .maybeSingle();

          if (candidateError) {
            logger.error('Error fetching candidate profile', candidateError, { context: 'AUTH' });
            setCandidateProfile(null);
          } else {
            setCandidateProfile(candidateData as CandidateProfile);
          }
        } else {
          setCandidateProfile(null);
        }
      }
      
      logger.log('fetchUserRoleAndOrganization completed', { context: 'AUTH' });
    };

    // Retry logic for transient failures
    const MAX_RETRIES = 2;
    let retryCount = 0;
    
    const fetchWithRetry = async (): Promise<void> => {
      try {
        await Promise.race([fetchLogic(), timeoutPromise]);
      } catch (error: unknown) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          logger.warn(`Role fetch failed, retrying (${retryCount}/${MAX_RETRIES})`, { error, context: 'AUTH' });
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry();
        }
        logger.error('Error fetching user data after retries', error, { context: 'AUTH' });
        setUserRole('user');
        setUserType('organization');
        setOrganization(null);
        setCandidateProfile(null);
      }
    };

    await fetchWithRetry();
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
        logger.log('Auth state changed', { event, hasSession: !!session, context: 'AUTH' });
        
        // Handle token refresh failure
        if (event === 'TOKEN_REFRESHED' && !session) {
          logger.log('Token refresh failed, clearing state', { context: 'AUTH' });
          clearAuthState();
          try {
            localStorage.removeItem('supabase.auth.token');
          } catch (e) {
            logger.error('Error clearing localStorage', e, { context: 'AUTH' });
          }
          setLoading(false);
          return;
        }

        // Handle sign out event
        if (event === 'SIGNED_OUT') {
          logger.log('User signed out, clearing state', { context: 'AUTH' });
          clearAuthState();
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoleAndOrganization(session.user.id).finally(() => {
              setLoading(false);
              logger.log('Loading complete after role fetch', { context: 'AUTH' });
            });
          }, 0);
        } else {
          setUserRole(null);
          setUserType(null);
          setOrganization(null);
          setCandidateProfile(null);
          setLoading(false);
          logger.log('Loading complete (no user)', { context: 'AUTH' });
        }
      }
    );

    // Check for existing session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        logger.log('Initial session check', { hasSession: !!session, hasError: !!error, context: 'AUTH' });
        
        if (error && isSessionExpiredError(error)) {
          logger.log('Session expired on initial check, clearing state', { context: 'AUTH' });
          clearAuthState();
          try {
            localStorage.removeItem('supabase.auth.token');
          } catch (e) {
            logger.error('Error clearing localStorage', e, { context: 'AUTH' });
          }
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoleAndOrganization(session.user.id).finally(() => {
              setLoading(false);
              logger.log('Initial load complete after role fetch', { context: 'AUTH' });
            });
          }, 0);
        } else {
          setLoading(false);
          logger.log('Initial load complete (no user)', { context: 'AUTH' });
        }
      })
      .catch((error) => {
        logger.error('Unexpected error during session check', error, { context: 'AUTH' });
        clearAuthState();
        try {
          localStorage.removeItem('supabase.auth.token');
        } catch (e) {
          logger.error('Error clearing localStorage', e, { context: 'AUTH' });
        }
        setLoading(false);
      });

    // Session heartbeat - refresh every 7 hours (before 8-hour expiry)
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error: getError } = await supabase.auth.getSession();
        
        if (getError || !session) {
          logger.log('Session invalid during refresh check, signing out', { context: 'AUTH' });
          await supabase.auth.signOut();
          return;
        }
        
        logger.log('Refreshing session (7-hour heartbeat)', { context: 'AUTH' });
        
        const { error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          logger.log('Session refresh failed', { error: refreshError.message, context: 'AUTH' });
          if (isSessionExpiredError(refreshError)) {
            logger.log('Session expired, signing out', { context: 'AUTH' });
            await supabase.auth.signOut();
          }
        } else {
          logger.log('Session refreshed successfully', { context: 'AUTH' });
        }
      } catch (err) {
        logger.error('Error during session refresh', err, { context: 'AUTH' });
      }
    }, 7 * 60 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    logger.log('signIn - starting', { email: email.substring(0, 3) + '***', context: 'AUTH' });
    
    try {
      logger.log('Calling supabase.auth.signInWithPassword', { context: 'AUTH' });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('Sign in authentication error', error, { context: 'AUTH' });
        return { error };
      }
      
      logger.log('Auth successful, session created', { 
        hasSession: !!data.session,
        userId: data.session?.user?.id?.substring(0, 8),
        context: 'AUTH'
      });
      
      if (!data.session?.user) {
        const noSessionError = new Error('No session created');
        logger.error('Sign in failed - no session', {}, { context: 'AUTH' });
        return { error: noSessionError };
      }
      
      logger.log('signIn completed successfully', { context: 'AUTH' });
      return { error: null };
    } catch (err) {
      logger.error('Unexpected error during sign in', err, { context: 'AUTH' });
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

  const isOrgAdmin = userRole === 'admin' && userType === 'organization';
  const isSuperAdmin = userRole === 'super_admin';

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
      loading,
      isOrgAdmin,
      isSuperAdmin
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
