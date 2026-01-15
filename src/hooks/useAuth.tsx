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
const VALID_ROLES = ['super_admin', 'admin', 'moderator', 'user'] as const;
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
    // subscription_status and plan_type removed - all features available to all users
  } | null;
  candidateProfile: CandidateProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userType?: 'organization' | 'jobseeker') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
  // Computed properties for role checks
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
    // subscription_status and plan_type removed - all features available to all users
  } | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserRoleAndOrganization = async (_userId: string) => {
    const timestamp = new Date().toISOString();
    const FETCH_TIMEOUT = 10000; // 10 seconds
    console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - STARTING for user:`, _userId.substring(0, 8) + '...');
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Role fetch timeout')), FETCH_TIMEOUT);
    });

    const fetchLogic = async () => {
      logger.info(`Fetching role and organization for user`, { userId: _userId });
      
      // Fetch role and profile in parallel for speed
      console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - fetching role and profile in parallel`);
      
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
        console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - RPC error:`, roleResult.error);
        logger.error('Error fetching user role', roleResult.error);
        setUserRole('user');
      } else {
        const fetchedRole = roleResult.data as string;
        // Normalize role - only accept known valid roles
        const normalizedRole: ValidRole = (VALID_ROLES as readonly string[]).includes(fetchedRole) 
          ? (fetchedRole as ValidRole) 
          : 'user';
        console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - role fetched:`, {
          raw: fetchedRole,
          normalized: normalizedRole,
          isOrgAdmin: normalizedRole === 'admin',
          isSuperAdmin: normalizedRole === 'super_admin'
        });
        setUserRole(normalizedRole);
      }

      // Process profile
      if (profileResult.error) {
        console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - profile error:`, profileResult.error);
        logger.error('Error fetching user profile', profileResult.error);
        setOrganization(null);
        setUserType('organization');
      } else {
        const dbUserType = (profileResult.data as any)?.user_type as 'organization' | 'jobseeker' | null;
        setUserType(dbUserType || 'organization');
        console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - user_type:`, dbUserType);

        if ((profileResult.data as any)?.organizations) {
          console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - organization loaded`);
          setOrganization((profileResult.data as any).organizations as any);
        } else {
          setOrganization(null);
        }

        // Fetch candidate profile if jobseeker
        if (dbUserType === 'jobseeker') {
          console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - fetching candidate profile`);
          const { data: candidateData, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', _userId)
            .maybeSingle();

          if (candidateError) {
            console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - candidate profile error:`, candidateError);
            setCandidateProfile(null);
          } else {
            setCandidateProfile(candidateData as CandidateProfile);
          }
        } else {
          setCandidateProfile(null);
        }
      }
      
      // Log final auth state summary for debugging
      console.log(`[AUTH][${timestamp}] Auth state summary:`, {
        userId: _userId.substring(0, 8) + '...',
        role: userRole,
        userType: userType,
        hasOrganization: !!organization,
        organizationId: organization?.id?.substring(0, 8),
        isOrgAdmin: userRole === 'admin' && userType === 'organization',
        isSuperAdmin: userRole === 'super_admin'
      });
      
      console.log(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - COMPLETED`);
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
          console.warn(`[AUTH][${timestamp}] Role fetch failed, retrying (${retryCount}/${MAX_RETRIES}):`, error);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry();
        }
        console.error(`[AUTH][${timestamp}] fetchUserRoleAndOrganization - EXCEPTION or TIMEOUT after ${MAX_RETRIES} retries:`, error);
        logger.error('Error fetching user data (may have timed out)', error);
        // Set defaults to unblock UI
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
          // Keep loading true until role fetch completes
          setTimeout(() => {
            fetchUserRoleAndOrganization(session.user.id).finally(() => {
              setLoading(false);
              console.log('[AUTH] Loading complete after role fetch');
            });
          }, 0);
        } else {
          setUserRole(null);
          setUserType(null);
          setOrganization(null);
          setCandidateProfile(null);
          setLoading(false);
          console.log('[AUTH] Loading complete (no user)');
        }
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
          // Keep loading true until role fetch completes
          setTimeout(() => {
            fetchUserRoleAndOrganization(session.user.id).finally(() => {
              setLoading(false);
              console.log('[AUTH] Initial load complete after role fetch');
            });
          }, 0);
        } else {
          setLoading(false);
          console.log('[AUTH] Initial load complete (no user)');
        }
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
      
      // fetchUserRoleAndOrganization is triggered by onAuthStateChange
      // Navigation is handled by useAuthForm's useEffect that watches user/userRole
      console.log(`[AUTH][${timestamp}] signIn - COMPLETED successfully, navigation handled by auth form`);
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

  // Computed role properties
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