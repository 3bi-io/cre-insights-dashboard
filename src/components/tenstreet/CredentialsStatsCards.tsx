import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, CheckCircle, Clock, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CredentialsStatsCardsProps {
  totalOrganizations: number;
  configuredOrganizations: number;
  pendingConfiguration: number;
  recentSyncActivity: number;
  isLoading?: boolean;
}

export function CredentialsStatsCards({
  totalOrganizations,
  configuredOrganizations,
  pendingConfiguration,
  recentSyncActivity,
  isLoading = false,
}: CredentialsStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Organizations',
      value: totalOrganizations,
      description: 'All registered organizations',
      icon: Building,
      iconColor: 'text-primary',
    },
    {
      title: 'Configured',
      value: configuredOrganizations,
      description: 'With active Tenstreet credentials',
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Pending Setup',
      value: pendingConfiguration,
      description: 'Organizations without credentials',
      icon: Clock,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Recent Activity',
      value: recentSyncActivity,
      description: 'Synced in last 24 hours',
      icon: Activity,
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
