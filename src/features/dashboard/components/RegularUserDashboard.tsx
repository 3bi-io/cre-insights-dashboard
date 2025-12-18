import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Briefcase,
  Clock,
  BarChart3
} from 'lucide-react';
import { PageLayout } from '@/features/shared';
import { useUserDashboardData } from '@/hooks/useUserDashboardData';
import { MetricCard } from './shared/MetricCard';
import { QuickActions } from './shared/QuickActions';
import { DashboardSkeleton } from './shared/DashboardSkeleton';

export const RegularUserDashboard = React.memo(() => {
  const { data: metrics, isLoading } = useUserDashboardData();

  const quickActions = useMemo(() => [
    { label: 'View Applications', href: '/admin/applications', icon: FileText },
    { label: 'Manage Jobs', href: '/admin/jobs', icon: Briefcase },
    { label: 'View AI Analytics', href: '/admin/ai-analytics', icon: BarChart3 },
  ], []);

  const sortedApplications = useMemo(() => 
    metrics?.recentApplications?.sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    ) || [],
    [metrics?.recentApplications]
  );

  if (isLoading) {
    return (
      <PageLayout 
        title="My Dashboard"
        description="Your personal metrics and activity"
      >
        <DashboardSkeleton cardCount={3} />
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="My Dashboard"
      description="Your personal metrics and activity"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="My Applications"
            value={metrics?.totalApplications || 0}
            icon={FileText}
            description="Total applications received"
          />

          <MetricCard
            title="Active Jobs"
            value={metrics?.activeJobs || 0}
            icon={Briefcase}
            description="Currently open positions"
          />

          <MetricCard
            title="Recent Activity"
            value={metrics?.recentActivity || 0}
            icon={Clock}
            description="New this week"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedApplications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest applications received</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{app.name}</p>
                        <p className="text-sm text-muted-foreground">{app.jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                        <Badge variant="secondary">{app.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <QuickActions actions={quickActions} />
        </div>
      </div>
    </PageLayout>
  );
});

RegularUserDashboard.displayName = 'RegularUserDashboard';
