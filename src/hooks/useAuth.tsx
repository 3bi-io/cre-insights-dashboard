
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { getCachedAuthData, setCachedAuthData, clearAuthCache } from './useAuthCache';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  userType: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    subscription_status?: string;
    plan_type?: 'free' | 'starter' | 'professional' | 'enterprise';
  } | null;
  candidateProfile: {
    id: string;
    first_name?: string;
    last_name?: string;
    profile_completion_percentage?: number;
  } | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, userType?: 'employer' | 'candidate') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    subscription_status?: string;
    plan_type?: 'free' | 'starter' | 'professional' | 'enterprise';
  } | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<{
    id: string;
    first_name?: string;
    last_name?: string;
    profile_completion_percentage?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

const fetchUserRoleAndOrganization = useCallback(async (_userId: string) => {
  try {
    console.log('[AUTH] Fetching role and organization for user:', _userId);
    logger.info(`Fetching role and organization for user`, { userId: _userId });
    
    // Try cache first for performance
    const cached = getCachedAuthData();
    if (cached) {
      console.log('[AUTH] Using cached auth data');
      setUserRole(cached.userRole);
      setOrganization(cached.organization);
      setUserType('employer');
      setCandidateProfile(null);
      // Still fetch in background to update cache
    }
    
    // Fetch user role using secure function
    const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
    
    if (roleError) {
      logger.error('Error fetching user role', roleError);
      console.log('[AUTH] Error fetching role:', roleError);
      if (!cached) setUserRole('user');
    } else {
      const role = (roleData as string) || 'user';
      console.log('[AUTH] Role loaded:', role);
      logger.debug('User role fetched', { role });
      setUserRole(role);
    }

    // Fetch user's profile with organization
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        organization_id,
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
      .maybeSingle() as any;

    if (profileError) {
      logger.error('Error fetching user profile', profileError);
      console.log('[AUTH] Error fetching profile:', profileError);
      if (!cached) {
        setOrganization(null);
        setUserType('employer');
      }
    } else {
      // Set user type - default to 'employer' since user_type column doesn't exist
      setUserType('employer');
      console.log('[AUTH] User type defaulted to employer');

      // Set organization
      const org = (profileData as any)?.organizations || null;
      if (org) {
        console.log('[AUTH] Organization loaded:', org.name);
        logger.info('User organization loaded', { 
          orgName: org.name,
          orgId: org.id 
        });
        setOrganization(org);
      } else {
        console.log('[AUTH] No organization found');
        logger.debug('No organization found for user');
        setOrganization(null);
      }

      // Update cache with fresh data
      setCachedAuthData(roleData as string || 'user', org);

      // Candidate profile logic removed - user_type and candidate_profile_id columns don't exist
      setCandidateProfile(null);
    }
  } catch (error: unknown) {
    logger.error('Error fetching user data', error);
    console.log('[AUTH] Exception fetching user data:', error);
    if (!getCachedAuthData()) {
      setUserRole('user');
      setUserType('employer');
      setOrganization(null);
      setCandidateProfile(null);
    }
  }
}, []);

  useEffect(() => {
    // Set up auth state listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    logger.debug('Auth state changed', { event, hasSession: !!session });
    console.log('[AUTH] Auth state changed:', { event, hasSession: !!session });
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      // Defer Supabase calls to prevent deadlock
      setTimeout(() => {
        fetchUserRoleAndOrganization(session.user.id);
      }, 0);
    } else {
      setUserRole(null);
      setOrganization(null);
    }
    
    setLoading(false);
    console.log('[AUTH] Loading complete');
  }
);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AUTH] Initial session check:', { hasSession: !!session });
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
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session && !error) {
        console.log('[AUTH] Refreshing session (7-hour heartbeat)');
        logger.info('Automatic session refresh triggered');
        await supabase.auth.refreshSession();
        console.log('[AUTH] Session refreshed successfully');
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
      
      // Get role to determine navigation
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      
      if (roleError) {
        logger.error('Error fetching role for navigation', roleError);
        console.error('[AUTH] Error fetching role:', roleError);
        // Default to dashboard if role fetch fails
        navigate('/dashboard');
        return { error: null };
      }
      
      const role = (roleData as string) || 'user';
      logger.info('Navigation decision', { role });
      console.log('[AUTH] Navigating based on role:', role);
      
      // Navigate based on role - default to employer/dashboard navigation
      if (role === 'super_admin') {
        navigate('/admin');
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

  const signUp = async (email: string, password: string, userType: 'employer' | 'candidate' = 'employer') => {
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            user_type: userType
          }
        }
      });
      
      if (error) {
        return { error };
      }

      // Create candidate profile if user type is candidate
      if (data.user && userType === 'candidate') {
        const { error: profileError } = await supabase
          .from('candidate_profiles' as any)
          .insert({
            user_id: data.user.id,
            email: email,
            profile_visibility: 'private',
            open_to_opportunities: true
          });

        if (profileError) {
          logger.error('Error creating candidate profile', profileError);
          console.error('[AUTH] Error creating candidate profile:', profileError);
        }
      }

      return { error: null };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Sign up failed');
      return { error: errorObj };
    }
  };

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthCache(); // Clear cache on logout
    setUserRole(null);
    setUserType(null);
    setOrganization(null);
    setCandidateProfile(null);
    navigate('/');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      clearAuthCache(); // Clear cache to force fresh data
      await fetchUserRoleAndOrganization(user.id);
    }
  }, [user?.id, fetchUserRoleAndOrganization]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [user, session, userRole, userType, organization, candidateProfile, signIn, signUp, signOut, refreshUser, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
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
