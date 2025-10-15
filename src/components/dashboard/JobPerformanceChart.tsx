import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export const JobPerformanceChart = () => {
  const { organization } = useAuth();

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['job-performance', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      // Get jobs with application counts
      const { data: jobs } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          created_at,
          status
        `)
        .eq('organization_id', organization.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!jobs) return [];

      // Get application counts for each job
      const jobStats = await Promise.all(
        jobs.map(async (job) => {
          const { count: appCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_listing_id', job.id);

          const { count: pendingCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_listing_id', job.id)
            .eq('status', 'pending');

          const { count: reviewedCount } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_listing_id', job.id)
            .in('status', ['reviewed', 'accepted']);

          return {
            name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
            total: appCount || 0,
            pending: pendingCount || 0,
            reviewed: reviewedCount || 0,
          };
        })
      );

      return jobStats.filter(stat => stat.total > 0);
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Job Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Job Performance (Top 10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#3b82f6" name="Total Applications" />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
            <Bar dataKey="reviewed" fill="#10b981" name="Reviewed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
