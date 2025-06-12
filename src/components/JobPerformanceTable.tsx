
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';

const jobData = [
  {
    id: 1,
    title: 'CDL Driver - OTR',
    platform: 'Indeed',
    spend: 2450,
    applications: 68,
    costPerApp: 36.03,
    status: 'Active',
    trend: 'up'
  },
  {
    id: 2,
    title: 'Regional Truck Driver',
    platform: 'LinkedIn',
    spend: 1890,
    applications: 45,
    costPerApp: 42.00,
    status: 'Active',
    trend: 'down'
  },
  {
    id: 3,
    title: 'Local Delivery Driver',
    platform: 'ZipRecruiter',
    spend: 1200,
    applications: 52,
    costPerApp: 23.08,
    status: 'Paused',
    trend: 'up'
  },
  {
    id: 4,
    title: 'Owner Operator',
    platform: 'Glassdoor',
    spend: 3100,
    applications: 34,
    costPerApp: 91.18,
    status: 'Active',
    trend: 'down'
  },
  {
    id: 5,
    title: 'Team Driver',
    platform: 'Monster',
    spend: 1650,
    applications: 41,
    costPerApp: 40.24,
    status: 'Active',
    trend: 'up'
  }
];

const JobPerformanceTable = () => {
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
                  <span className="font-medium text-gray-900">${job.costPerApp.toFixed(2)}</span>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge variant={job.status === 'Active' ? 'default' : 'secondary'}>
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
