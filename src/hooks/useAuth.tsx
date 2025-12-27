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
    try {
      console.log('[AUTH] Fetching role and organization for user:', _userId);
      logger.info(`Fetching role and organization for user`, { userId: _userId });
      
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      if (roleError) {
        logger.error('Error fetching user role', roleError);
        console.log('[AUTH] Error fetching role:', roleError);
        setUserRole('user');
      } else {
        console.log('[AUTH] Role loaded:', roleData);
        logger.debug('User role fetched', { role: roleData });
        if (roleData === 'super_admin') {
          setUserRole('super_admin');
        } else {
          setUserRole((roleData as string) || 'user');
        }
      }

      // Fetch user's profile with organization and user_type
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
        logger.error('Error fetching user profile', profileError);
        console.log('[AUTH] Error fetching profile:', profileError);
        setOrganization(null);
        setUserType('organization');
      } else {
        // Set user type from database
        const dbUserType = (profileData as any)?.user_type as 'organization' | 'jobseeker' | null;
        setUserType(dbUserType || 'organization');
        console.log('[AUTH] User type:', dbUserType);

        // Set organization
        if ((profileData as any)?.organizations) {
          console.log('[AUTH] Organization loaded:', (profileData as any).organizations.name);
          logger.info('User organization loaded', { 
            orgName: (profileData as any).organizations.name,
            orgId: (profileData as any).organizations.id 
          });
          setOrganization((profileData as any).organizations as any);
        } else {
          console.log('[AUTH] No organization found');
          logger.debug('No organization found for user');
          setOrganization(null);
        }

        // Fetch candidate profile if user is a jobseeker
        if (dbUserType === 'jobseeker') {
          const { data: candidateData, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', _userId)
            .maybeSingle();

          if (candidateError) {
            logger.error('Error fetching candidate profile', candidateError);
            console.log('[AUTH] Error fetching candidate profile:', candidateError);
            setCandidateProfile(null);
          } else if (candidateData) {
            console.log('[AUTH] Candidate profile loaded');
            setCandidateProfile(candidateData as CandidateProfile);
          } else {
            setCandidateProfile(null);
          }
        } else {
          setCandidateProfile(null);
        }
      }
    } catch (error: unknown) {
      logger.error('Error fetching user data', error);
      console.log('[AUTH] Exception fetching user data:', error);
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

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[AUTH] Initial session check:', { hasSession: !!session, hasError: !!error });
      
      // Handle session expired errors gracefully
      if (error && isSessionExpiredError(error)) {
        console.log('[AUTH] Session expired on initial check, clearing state');
        logger.info('Session expired, user needs to re-authenticate');
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
      }
      
      setLoading(false);
      console.log('[AUTH] Initial load complete');
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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        logger.error('Sign in error', error);
        console.error('[AUTH] Sign in error:', error);
        return { error };
      }
      
      if (!data.session?.user) {
        const noSessionError = new Error('No session created');
        logger.error('Sign in failed - no session', {});
        console.error('[AUTH] No session created');
        return { error: noSessionError };
      }
      
      logger.info('Sign in successful, fetching user data');
      console.log('[AUTH] Sign in successful, fetching user data');
      
      // Wait for role and organization to be fetched
      await fetchUserRoleAndOrganization(data.session.user.id);
      
      // Get user profile to determine navigation based on user_type
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', data.session.user.id)
        .maybeSingle();
      
      const userTypeFromDb = (profileData as any)?.user_type || 'organization';
      
      // Get role to determine navigation
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      
      if (roleError) {
        logger.error('Error fetching role for navigation', roleError);
        console.error('[AUTH] Error fetching role:', roleError);
      }
      
      const role = (roleData as string) || 'user';
      logger.info('Navigation decision', { role, userType: userTypeFromDb });
      console.log('[AUTH] Navigating based on role and userType:', { role, userType: userTypeFromDb });
      
      // Navigate based on role and user type
      if (role === 'super_admin') {
        navigate('/admin');
      } else if (userTypeFromDb === 'jobseeker') {
        navigate('/my-jobs');
      } else {
        navigate('/dashboard');
      }
      
      return { error: null };
    } catch (err) {
      logger.error('Unexpected error during sign in', err);
      console.error('[AUTH] Unexpected error during sign in:', err);
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