import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { queryKeys } from '@/lib/queryKeys';

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  recentUsers: UserData[];
}

export const useOrganizationUserData = () => {
  const { organization } = useAuth();

  return useQuery({
    queryKey: queryKeys.orgDashboard.userData(organization?.id || ''),
    queryFn: async (): Promise<UserMetrics> => {
      if (!organization?.id) {
        return {
          totalUsers: 0,
          activeUsers: 0,
          adminUsers: 0,
          recentUsers: [],
        };
      }

      // Get all users in the organization
      const { data: users, count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user roles for this organization
      const userIds = users?.map(u => u.id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds)
        .eq('organization_id', organization.id);

      // Count admin users
      const adminUsers = roles?.filter(r => r.role === 'admin' || r.role === 'super_admin').length || 0;

      // Create user data with roles
      const recentUsers = (users || []).slice(0, 5).map(user => {
        const userRole = roles?.find(r => r.user_id === user.id);
        return {
          id: user.id,
          email: user.email || '',
          full_name: user.full_name,
          role: userRole?.role || 'user',
          created_at: user.created_at,
        };
      });

      return {
        totalUsers: totalUsers || 0,
        activeUsers: totalUsers || 0, // For now, assume all users are active
        adminUsers,
        recentUsers,
      };
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
