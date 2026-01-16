import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MoreHorizontal, TrendingUp, TrendingDown, DollarSign, Users, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryKeys';
import { ResponsiveTableWrapper, ResponsiveCardWrapper } from '@/components/ui/responsive-data-display';

const JobPerformanceTable = () => {
  const { data: jobData = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.jobs.performance(),
    queryFn: async () => {
      logger.debug('Fetching job performance data', undefined, 'JobPerformance');
      
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
          clients!fk_job_listings_client_id(name),
          daily_spend(amount, date),
          applications(id, created_at)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Error fetching job performance', error, 'JobPerformance');
        throw error;
      }

      logger.debug('Job performance data fetched', { count: jobs?.length }, 'JobPerformance');

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
          publisher: job.job_platform_associations?.map(assoc => assoc.platforms?.name).join(', ') || 'No Publisher',
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
            <Link to="/admin/jobs">View All</Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          No job performance data available
        </div>
      </div>
    );
  }

  // Mobile card component for each job
  const JobCard = ({ job }: { job: typeof jobData[0] }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{job.title}</h4>
            <p className="text-sm text-primary font-medium">{job.client}</p>
            <p className="text-xs text-muted-foreground">{job.publisher}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="text-xs">
              {job.status}
            </Badge>
            {job.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Spend</span>
            </div>
            <p className="font-semibold text-sm">${job.spend.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              <span className="text-xs">Apps</span>
            </div>
            <p className="font-semibold text-sm">{job.applications}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Briefcase className="w-3 h-3" />
              <span className="text-xs">CPA</span>
            </div>
            <p className="font-semibold text-sm">
              {job.costPerApp > 0 ? `$${job.costPerApp.toFixed(2)}` : '$0'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground">Job Performance</h3>
        <Button variant="outline" size="sm" asChild className="h-9 min-w-[80px]">
          <Link to="/admin/jobs">View All</Link>
        </Button>
      </div>
      
      {/* Mobile Card View */}
      <ResponsiveCardWrapper className="space-y-3">
        {jobData.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </ResponsiveCardWrapper>

      {/* Desktop Table View */}
      <ResponsiveTableWrapper>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Job Title</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Publisher</th>
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
                    <span className="text-muted-foreground">{job.publisher}</span>
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
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ResponsiveTableWrapper>
    </div>
  );
};

export default JobPerformanceTable;
