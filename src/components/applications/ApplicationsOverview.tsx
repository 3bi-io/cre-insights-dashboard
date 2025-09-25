import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApplicationsOverviewProps {
  statusCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
}

const ApplicationsOverview = ({ statusCounts, categoryCounts }: ApplicationsOverviewProps) => {
  const categories = [
    { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800', desc: 'CDL + Age + 3+ months exp' },
    { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800', desc: 'CDL + Age + <3 months exp' },
    { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800', desc: 'No CDL + Age + <3 months exp' },
    { code: 'N/A', label: 'Uncategorized', color: 'bg-gray-100 text-gray-800', desc: 'Other combinations' }
  ];

  const totalApplications = Object.values(statusCounts || {}).reduce((sum, count) => sum + count, 0);

  return (
    <>
      {/* Header with AI Analytics Link */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Applications Overview</h3>
        <div className="flex gap-2">
          <Link to="/admin/ai-analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              AI Analytics
            </Button>
          </Link>
          <Badge variant="outline" className="bg-primary/10">
            {totalApplications} Total Applications
          </Badge>
        </div>
      </div>
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['pending', 'reviewed', 'interviewed', 'hired', 'rejected'].map((status) => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {statusCounts?.[status] || 0}
              </div>
              <div className="text-sm text-gray-600 capitalize">{status}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Applicant Categories Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.code}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge className={`text-lg font-bold px-3 py-1 ${category.color}`}>
                  {category.code}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {categoryCounts?.[category.code] || 0}
              </div>
              <div className="text-sm font-medium text-gray-300 mb-1">{category.label}</div>
              <div className="text-xs text-gray-500">{category.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default ApplicationsOverview;