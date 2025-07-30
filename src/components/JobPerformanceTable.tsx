
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const JobPerformanceTable = () => {
  const { data: jobData = [], isLoading, refetch } = useQuery({
    queryKey: ['job-performance'],
    queryFn: async () => {
      console.log('Fetching job performance data...');
      
      // Get job listings with their spend and application data
      const { data: jobs, error } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          job_title,
          status,
          client,
          created_at,
          job_platform_associations(
            platforms(name)
          ),
          clients(name),
          daily_spend(amount, date),
          applications(id, created_at)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching job performance:', error);
        throw error;
      }

      console.log('Job performance data fetched:', jobs?.length);

      if (!jobs) return [];

      return jobs.map(job => {
        const totalSpend = job.daily_spend?.reduce((sum, spend) => sum + Number(spend.amount || 0), 0) || 0;
        const applicationCount = job.applications?.length || 0;
        const costPerApp = applicationCount > 0 ? totalSpend / applicationCount : 0;
        
        // Calculate trend based on recent applications (last 7 days vs previous 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        const recentApps = job.applications?.filter(app => 
          new Date(app.created_at) >= sevenDaysAgo
        ).length || 0;
        
        const previousApps = job.applications?.filter(app => {
          const appDate = new Date(app.created_at);
          return appDate >= fourteenDaysAgo && appDate < sevenDaysAgo;
        }).length || 0;
        
        const trend = recentApps >= previousApps ? 'up' : 'down';

        return {
          id: job.id,
          title: job.title || job.job_title || 'Untitled Job',
          platform: job.job_platform_associations?.map(assoc => assoc.platforms?.name).join(', ') || 'No Platform',
          client: job.clients?.name || job.client || 'No Client',
          spend: totalSpend,
          applications: applicationCount,
          costPerApp,
          status: job.status || 'active',
          trend
        };
      });
    },
    // Refresh every 30 seconds
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Job Performance by Listing</h3>
          <Button variant="outline" size="sm" disabled>View All</Button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (jobData.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Job Performance by Listing</h3>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/jobs">View All</Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No job performance data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Job Performance by Listing</h3>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/jobs">View All</Link>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Job Title</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Spend</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Applications</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost/App</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Trend</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobData.map((job) => (
              <tr key={job.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-foreground">{job.title}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-muted-foreground">{job.platform}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="font-medium text-primary">{job.client}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">${job.spend.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">{job.applications}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">
                    {job.costPerApp > 0 ? `$${job.costPerApp.toFixed(2)}` : '$0.00'}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                </td>
                <td className="py-4 px-4 text-center">
                  {job.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mx-auto" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mx-auto" />
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobPerformanceTable;
