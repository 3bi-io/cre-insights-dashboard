import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EmptyStateMessage } from '@/components/shared/EmptyStateMessage';

interface ApplicationsOverviewProps {
  statusCounts?: Record<string, number>;
  categoryCounts?: Record<string, number>;
  totalCount?: number;
  onStatusClick?: (status: string) => void;
  onCategoryClick?: (category: string) => void;
  activeStatusFilter?: string;
  activeCategoryFilter?: string;
}

const ApplicationsOverview = ({ 
  statusCounts, 
  categoryCounts,
  totalCount,
  onStatusClick,
  onCategoryClick,
  activeStatusFilter = 'all',
  activeCategoryFilter = 'all',
}: ApplicationsOverviewProps) => {
  const categories = [
    { code: 'D', label: 'Experienced Driver', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', desc: 'CDL + Age + 3+ months exp' },
    { code: 'SC', label: 'New CDL Holder', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', desc: 'CDL + Age + <3 months exp' },
    { code: 'SR', label: 'Student Ready', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', desc: 'No CDL + Age + <3 months exp' },
    { code: 'N/A', label: 'Uncategorized', color: 'bg-muted text-muted-foreground', desc: 'Other combinations' }
  ];

  const displayTotal = totalCount ?? Object.values(statusCounts || {}).reduce((sum, count) => sum + count, 0);

  const handleStatusClick = (status: string) => {
    if (onStatusClick) {
      // Toggle behavior: if clicking the active filter, clear it
      onStatusClick(activeStatusFilter === status ? 'all' : status);
    }
  };

  const handleCategoryClick = (categoryCode: string) => {
    if (onCategoryClick) {
      // Toggle behavior: if clicking the active filter, clear it
      onCategoryClick(activeCategoryFilter === categoryCode ? 'all' : categoryCode);
    }
  };

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
            {displayTotal} Total Applications
          </Badge>
        </div>
      </div>

      {displayTotal === 0 ? (
        <EmptyStateMessage
          icon={Users}
          title="No applications yet"
          description="Applications will appear here once candidates start applying to your job listings. Make sure you have active job postings to receive applications."
          actionLabel="View Job Listings"
          actionHref="/admin/jobs"
        />
      ) : (
        <>
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {['pending', 'reviewed', 'interviewed', 'hired', 'rejected'].map((status) => (
              <Card 
                key={status}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                  activeStatusFilter === status && "ring-2 ring-primary border-primary"
                )}
                onClick={() => handleStatusClick(status)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {statusCounts?.[status] || 0}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">{status}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Applicant Categories Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.code}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                  activeCategoryFilter === category.code && "ring-2 ring-primary border-primary"
                )}
                onClick={() => handleCategoryClick(category.code)}
              >
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className={`text-lg font-bold px-3 py-1 ${category.color}`}>
                      {category.code}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {categoryCounts?.[category.code] || 0}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">{category.label}</div>
                  <div className="text-xs text-muted-foreground/70">{category.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default ApplicationsOverview;
