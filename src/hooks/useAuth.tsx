
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: any;
  } | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
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
    settings?: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

const fetchUserRoleAndOrganization = async (_userId: string) => {
  try {
    // Fetch user role
    const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
    if (roleError) {
      console.error('Error fetching user role:', roleError?.message || roleError);
      setUserRole('user');
    } else {
      console.log('User role fetched:', roleData);
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
          settings
        )
      `)
      .eq('id', _userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      setOrganization(null);
    } else if (profileData?.organizations) {
      console.log('User organization fetched:', profileData.organizations);
      setOrganization(profileData.organizations as any);
    } else {
      // Super admins don't need an organization
      setOrganization(null);
    }
  } catch (error: any) {
    console.error('Error fetching user data:', error?.message || error);
    setUserRole('user');
    setOrganization(null);
  }
};

  useEffect(() => {
    // Set up auth state listener
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log('Auth state changed:', event, session);
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      // Use setTimeout to prevent potential deadlocks
      setTimeout(() => {
        fetchUserRoleAndOrganization(session.user.id);
      }, 0);
    } else {
      setUserRole(null);
      setOrganization(null);
    }
    
    setLoading(false);
  }
);

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserRoleAndOrganization(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      try {
        const { data: roleData } = await supabase.rpc('get_current_user_role');
        const role = (roleData as string) || 'user';
        if (role === 'super_admin') {
          navigate('/admin');
        } else if (role === 'admin') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch {
        navigate('/');
      }
    }
    
    return { error };
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
