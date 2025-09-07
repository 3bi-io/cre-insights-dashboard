import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BarChart3, 
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { OrganizationMetricsCard } from './organization/OrganizationMetrics';
import { OrganizationOverview } from './organization/OrganizationOverview';
import { OrganizationUserManagement } from './organization/OrganizationUserManagement';
import { OrganizationJobManagement } from './organization/OrganizationJobManagement';
import DashboardTabs from './DashboardTabs';

interface OrganizationAdminDashboardProps {
  organizationName?: string;
}

export const OrganizationAdminDashboard = ({ organizationName }: OrganizationAdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {organizationName || 'Organization'} Dashboard
              </h1>
              <p className="text-muted-foreground text-lg">
                Organization management and analytics
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Organization Admin
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <OrganizationMetricsCard
            title="Active Users"
            value="24"
            description="Organization members"
            icon={Users}
            trend={{ value: "+2 this month", positive: true }}
          />
          <OrganizationMetricsCard
            title="Active Jobs"
            value="156"
            description="Currently posted"
            icon={BarChart3}
            trend={{ value: "+8 this week", positive: true }}
          />
          <OrganizationMetricsCard
            title="Applications"
            value="2,847"
            description="This month"
            icon={UserCheck}
            trend={{ value: "+15.2%", positive: true }}
          />
          <OrganizationMetricsCard
            title="Monthly Spend"
            value="$45,280"
            description="Advertising budget"
            icon={TrendingUp}
            trend={{ value: "-2.1%", positive: false }}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OrganizationOverview />
          </TabsContent>

          <TabsContent value="jobs" className="mt-6">
            <OrganizationJobManagement />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <OrganizationUserManagement />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <DashboardTabs activeTab="dashboard" onTabChange={() => {}} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};