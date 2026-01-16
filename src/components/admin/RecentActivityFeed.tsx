import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, UserPlus, Building, Briefcase, UserCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { queryKeys } from '@/lib/queryKeys';

interface ActivityItem {
  id: string;
  type: 'user_signup' | 'organization_created' | 'job_posted' | 'application_received';
  description: string;
  timestamp: string;
  metadata?: any;
}

export const RecentActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const { data: recentData } = useQuery({
    queryKey: queryKeys.system.recentActivity(),
    queryFn: async () => {
      const [users, orgs, jobs, apps] = await Promise.all([
        supabase.from('profiles').select('id, email, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('organizations').select('id, name, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('job_listings').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('applications').select('id, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const combined: ActivityItem[] = [
        ...(users.data?.map(u => ({
          id: u.id,
          type: 'user_signup' as const,
          description: `New user signed up: ${u.email}`,
          timestamp: u.created_at,
        })) || []),
        ...(orgs.data?.map(o => ({
          id: o.id,
          type: 'organization_created' as const,
          description: `Organization created: ${o.name}`,
          timestamp: o.created_at,
        })) || []),
        ...(jobs.data?.map(j => ({
          id: j.id,
          type: 'job_posted' as const,
          description: `Job posted: ${j.title}`,
          timestamp: j.created_at,
        })) || []),
        ...(apps.data?.map(a => ({
          id: a.id,
          type: 'application_received' as const,
          description: `Application from ${a.first_name} ${a.last_name}`,
          timestamp: a.created_at,
        })) || []),
      ];

      return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
    },
    staleTime: 30000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (recentData) {
      setActivities(recentData);
    }
  }, [recentData]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_signup': return UserPlus;
      case 'organization_created': return Building;
      case 'job_posted': return Briefcase;
      case 'application_received': return UserCheck;
    }
  };

  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_signup': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'organization_created': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'job_posted': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'application_received': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className={`p-2 rounded-lg ${getColor(activity.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
