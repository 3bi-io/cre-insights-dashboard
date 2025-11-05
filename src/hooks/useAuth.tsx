
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    subscription_status?: string;
  } | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, unknown>;
    subscription_status?: string;
  } | null>(null);
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
      // Check if user is super admin by email or role
      if (roleData === 'super_admin') {
        setUserRole('super_admin');
      } else {
        setUserRole((roleData as string) || 'user');
      }
    }

    // Fetch user's organization via profile (super admins may not have an organization)
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
          subscription_status
        )
      `)
      .eq('id', _userId)
      .maybeSingle();

    if (profileError) {
      logger.error('Error fetching user profile', profileError);
      console.log('[AUTH] Error fetching organization:', profileError);
      setOrganization(null);
    } else if (profileData?.organizations) {
      console.log('[AUTH] Organization loaded:', profileData.organizations.name);
      logger.info('User organization loaded', { 
        orgName: profileData.organizations.name,
        orgId: profileData.organizations.id 
      });
      setOrganization(profileData.organizations as any);
    } else {
      console.log('[AUTH] No organization found (may be super admin)');
      logger.debug('No organization found for user (may be super admin)');
      setOrganization(null);
    }
  } catch (error: unknown) {
    logger.error('Error fetching user data', error);
    console.log('[AUTH] Exception fetching user data:', error);
    setUserRole('user');
    setOrganization(null);
  }
};

  useEffect(() => {
    // Set up auth state listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    logger.debug('Auth state changed', { event, hasSession: !!session });
    console.log('[AUTH] Auth state changed:', { event, hasSession: !!session });
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      // Await the fetch to ensure data is loaded before setting loading to false
      await fetchUserRoleAndOrganization(session.user.id);
    } else {
      setUserRole(null);
      setOrganization(null);
    }
    
    setLoading(false);
    console.log('[AUTH] Loading complete');
  }
);

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AUTH] Initial session check:', { hasSession: !!session });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRoleAndOrganization(session.user.id);
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
      
      // Navigate based on role
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

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole(null);
    setOrganization(null);
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
      organization,
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
