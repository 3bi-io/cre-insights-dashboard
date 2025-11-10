export interface DashboardMetrics {
  totalApplications: number;
  activeJobs: number;
  recentActivity: number;
  applicationsByStatus?: {
    pending: number;
    reviewed: number;
    accepted: number;
    rejected: number;
  };
  recentApplications?: Array<{
    id: string;
    name: string;
    jobTitle: string;
    appliedAt: string;
    status: string;
  }>;
}

export interface SuperAdminMetrics {
  totalOrganizations: number;
  totalUsers: number;
  totalApplications: number;
  systemHealth: number;
  organizationGrowth: MetricGrowth;
  userGrowth: MetricGrowth;
}

export interface MetricGrowth {
  current: number;
  previous: number;
  percentageChange: number;
}

export type DashboardView = 'super_admin' | 'admin' | 'user';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
