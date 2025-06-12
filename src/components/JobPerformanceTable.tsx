
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
          daily_spend(amount),
          applications(id)
        `)
        .limit(5);

      if (!jobs) return [];

      return jobs.map(job => {
        const totalSpend = job.daily_spend.reduce((sum, spend) => sum + Number(spend.amount), 0);
        const applicationCount = job.applications.length;
        const costPerApp = applicationCount > 0 ? totalSpend / applicationCount : 0;
        
        // Simple trend calculation (could be enhanced with time-based data)
        const trend = Math.random() > 0.5 ? 'up' : 'down'; // Random for now

        return {
          id: job.id,
          title: job.title,
          platform: job.platforms.name,
          spend: totalSpend,
          applications: applicationCount,
          costPerApp,
          status: job.status || 'Active',
          trend
        };
      });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Job Performance by Listing</h3>
          <Button variant="outline" size="sm" disabled>View All</Button>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (jobData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Job Performance by Listing</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          No job performance data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Job Performance by Listing</h3>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Job Title</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Platform</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Spend</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Applications</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Cost/App</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Trend</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobData.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{job.title}</div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-gray-600">{job.platform}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-gray-900">${job.spend.toLocaleString()}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-gray-900">{job.applications}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-medium text-gray-900">
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
