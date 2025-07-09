
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const JobPerformanceTable = () => {
  const { data: jobData = [], isLoading } = useQuery({
    queryKey: ['job-performance'],
    queryFn: async () => {
      // Get job listings with their spend and application data
      const { data: jobs } = await supabase
        .from('job_listings')
        .select(`
          id,
          title,
          status,
          platforms!inner(name),
          clients(name),
          daily_spend(amount, clicks, views),
          applications(id)
        `)
        .limit(5);

      if (!jobs) return [];

      return jobs.map(job => {
        const totalSpend = job.daily_spend.reduce((sum, spend) => sum + Number(spend.amount), 0);
        const applicationCount = job.applications.length;
        const totalReach = job.daily_spend.reduce((sum, spend) => sum + Number(spend.clicks || 0), 0);
        const totalImpressions = job.daily_spend.reduce((sum, spend) => sum + Number(spend.views || 0), 0);
        const costPerResult = applicationCount > 0 ? totalSpend / applicationCount : 0;

        return {
          id: job.id,
          title: job.title,
          platform: job.platforms.name,
          spend: totalSpend,
          reach: totalReach,
          impressions: totalImpressions,
          results: applicationCount,
          costPerResult,
          status: job.status || 'active'
        };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Campaign Performance</h3>
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
          <h3 className="text-lg font-semibold text-foreground">Campaign Performance</h3>
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
        <h3 className="text-lg font-semibold text-foreground">Campaign Performance</h3>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/jobs">View All</Link>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Campaign Name</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Reach</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Impressions</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount Spent</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Results</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Cost per Result</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
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
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">{job.reach.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">{job.impressions.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">${job.spend.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">{job.results}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-foreground">
                    {job.costPerResult > 0 ? `$${job.costPerResult.toFixed(2)}` : '$0.00'}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
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
