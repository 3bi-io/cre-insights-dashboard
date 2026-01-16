import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Radio, 
  Workflow, 
  Settings,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Activity,
  FileText,
  Briefcase,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AdminSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
  status: 'healthy' | 'warning' | 'error' | 'loading';
  statusText: string;
  metric?: string | number;
  metricLabel?: string;
}

interface RecentActivityItem {
  id: string;
  action: string;
  table_name: string;
  created_at: string;
}

export function AdminNavigationDashboard() {
  const navigate = useNavigate();

  // Fetch organization count
  const { data: orgCount, isLoading: orgLoading } = useQuery({
    queryKey: ['admin-nav-orgs'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch ATS connections status
  const { data: atsStats, isLoading: atsLoading } = useQuery({
    queryKey: ['admin-nav-ats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ats_connections')
        .select('status');
      if (error) throw error;
      const active = data?.filter(c => c.status === 'active').length || 0;
      const total = data?.length || 0;
      return { active, total };
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch platforms count
  const { data: platformCount, isLoading: platformLoading } = useQuery({
    queryKey: ['admin-nav-platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platforms')
        .select('id');
      if (error) throw error;
      return data?.length || 0;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['admin-nav-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as RecentActivityItem[];
    },
    staleTime: 60 * 1000,
  });

  const sections: AdminSection[] = [
    {
      id: 'organizations',
      title: 'Organizations',
      description: 'Manage organizations, features, and platform access',
      icon: Building2,
      path: '/admin/organizations',
      status: orgLoading ? 'loading' : 'healthy',
      statusText: 'All systems operational',
      metric: orgCount,
      metricLabel: 'Total organizations'
    },
    {
      id: 'publishers',
      title: 'Publishers',
      description: 'Job board integrations and feed management',
      icon: Radio,
      path: '/admin/publishers',
      status: platformLoading ? 'loading' : platformCount && platformCount > 0 ? 'healthy' : 'warning',
      statusText: platformCount && platformCount > 0 ? 'Platforms active' : 'No active platforms',
      metric: platformCount,
      metricLabel: 'Active platforms'
    },
    {
      id: 'ats',
      title: 'ATS Command',
      description: 'ATS integrations, screening, and bulk operations',
      icon: Workflow,
      path: '/admin/ats-command',
      status: atsLoading ? 'loading' : atsStats?.active === atsStats?.total ? 'healthy' : 'warning',
      statusText: atsStats ? `${atsStats.active}/${atsStats.total} connections active` : 'Loading...',
      metric: atsStats?.active,
      metricLabel: 'Active connections'
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'System configuration and preferences',
      icon: Settings,
      path: '/admin/settings',
      status: 'healthy',
      statusText: 'Configured',
      metric: undefined,
      metricLabel: undefined
    }
  ];

  const getStatusIcon = (status: AdminSection['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'loading':
        return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />;
    }
  };

  const getStatusBadgeVariant = (status: AdminSection['status']) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'loading':
        return 'outline';
    }
  };

  const formatActivityAction = (action: string, tableName: string) => {
    // Handle custom action strings (e.g., "LIST_ACCESS: General application review")
    if (action.includes(':')) {
      const [actionType, description] = action.split(':').map(s => s.trim());
      const actionLabels: Record<string, string> = {
        'LIST_ACCESS': 'Viewed',
        'UNAUTHORIZED_ACCESS_ATTEMPT': 'Access denied',
        'UNAUTHORIZED_SENSITIVE_ACCESS_ATTEMPT': 'Blocked access',
        'TENSTREET_SEARCH_APPLICANTS': 'ATS search',
      };
      const label = actionLabels[actionType] || actionType;
      return description ? `${label}: ${description}` : label;
    }

    // Handle standard SQL actions
    const actionMap: Record<string, string> = {
      'INSERT': 'Created',
      'UPDATE': 'Updated',
      'DELETE': 'Deleted',
      'SELECT': 'Viewed'
    };
    const tableMap: Record<string, string> = {
      'organizations': 'organization',
      'applications': 'application',
      'job_listings': 'job listing',
      'ats_connections': 'ATS connection',
      'platforms': 'platform',
      'user_roles': 'user role',
      'organization_features': 'org feature',
      'profiles': 'profile',
      'authorization': 'access attempt'
    };
    return `${actionMap[action] || action} ${tableMap[tableName] || tableName}`;
  };

  const getActivityIcon = (action: string, tableName: string) => {
    if (action.includes('UNAUTHORIZED')) return AlertCircle;
    if (action.includes('TENSTREET') || action.includes('ATS')) return Workflow;
    if (tableName === 'organizations') return Building2;
    if (tableName === 'applications') return FileText;
    if (tableName === 'job_listings') return Briefcase;
    if (tableName === 'profiles') return UserPlus;
    return Users;
  };

  return (
    <div className="space-y-6">
      {/* Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50",
                "group"
              )}
              onClick={() => navigate(section.path)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant={getStatusBadgeVariant(section.status)} className="text-xs">
                    {getStatusIcon(section.status)}
                    <span className="ml-1">{section.status === 'loading' ? 'Loading' : section.status}</span>
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{section.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div>
                    {section.metric !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{section.metric}</span>
                        <span className="text-xs text-muted-foreground">{section.metricLabel}</span>
                      </div>
                    )}
                    {section.metric === undefined && (
                      <span className="text-sm text-muted-foreground">{section.statusText}</span>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
          <CardDescription>Latest administrative actions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {formatActivityAction(activity.action, activity.table_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminNavigationDashboard;
