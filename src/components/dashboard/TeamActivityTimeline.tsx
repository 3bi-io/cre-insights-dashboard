import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, UserPlus, Briefcase, UserCheck, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Activity {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  timestamp: string;
  type: 'job' | 'application' | 'user' | 'message';
}

export const TeamActivityTimeline = () => {
  const { organization } = useAuth();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['team-activity', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get recent jobs
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('id, title, created_at, profiles(email, full_name)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent applications
      const { data: apps } = await supabase
        .from('applications')
        .select('id, first_name, last_name, created_at, job_listings!inner(organization_id, title)')
        .eq('job_listings.organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const combined: Activity[] = [
        ...(jobs?.map(j => ({
          id: j.id,
          user_name: (j.profiles as any)?.full_name || 'Unknown',
          user_email: (j.profiles as any)?.email || '',
          action: `posted job "${j.title}"`,
          timestamp: j.created_at,
          type: 'job' as const,
        })) || []),
        ...(apps?.map(a => ({
          id: a.id,
          user_name: 'System',
          user_email: '',
          action: `received application from ${a.first_name} ${a.last_name} for "${(a.job_listings as any)?.title}"`,
          timestamp: a.created_at,
          type: 'application' as const,
        })) || []),
      ];

      return combined.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 15);
    },
    staleTime: 30000,
  });

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'job': return Briefcase;
      case 'application': return UserCheck;
      case 'user': return UserPlus;
      case 'message': return MessageSquare;
    }
  };

  const getColor = (type: Activity['type']) => {
    switch (type) {
      case 'job': return 'bg-purple-100 text-purple-700';
      case 'application': return 'bg-green-100 text-green-700';
      case 'user': return 'bg-blue-100 text-blue-700';
      case 'message': return 'bg-orange-100 text-orange-700';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities?.map((activity, index) => {
              const Icon = getIcon(activity.type);
              const initials = activity.user_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);

              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${getColor(activity.type)}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-4 border-b last:border-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
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
