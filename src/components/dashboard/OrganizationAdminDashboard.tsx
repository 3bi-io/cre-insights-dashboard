import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BarChart3, 
  UserCheck,
  TrendingUp,
  Phone,
  Bot,
  Share2
} from 'lucide-react';
import { OrganizationMetricsCard } from './organization/OrganizationMetrics';
import { OrganizationOverview } from './organization/OrganizationOverview';
import { OrganizationUserManagement } from './organization/OrganizationUserManagement';
import { OrganizationJobManagement } from './organization/OrganizationJobManagement';
import { OrganizationFeatureStatus } from './organization/OrganizationFeatureStatus';
import { OrganizationBrandingPanel } from './organization/OrganizationBrandingPanel';
import { AIFeaturesPanel } from './organization/AIFeaturesPanel';
import { FeatureGuard } from '@/components/FeatureGuard';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { useAuth } from '@/hooks/useAuth';
import { OrganizationPageFrameworks } from '../organizations/OrganizationPageFrameworks';
import DashboardTabs from './DashboardTabs';

interface OrganizationAdminDashboardProps {
  organizationName?: string;
}

export const OrganizationAdminDashboard = ({ organizationName }: OrganizationAdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { organization } = useAuth();
  const { 
    hasTenstreetAccess, 
    hasVoiceAgent, 
    hasAdvancedAnalytics,
    hasAIAccess 
  } = useOrganizationFeatures();

  const handleUpdateOrganization = (organizationId: string, settings: any) => {
    // This would typically call an API to update the organization
    console.log('Update organization:', organizationId, settings);
  };

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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger 
              value="ai" 
              disabled={!hasAIAccess()}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger 
              value="tenstreet" 
              disabled={!hasTenstreetAccess()}
              className="flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Tenstreet
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              disabled={!hasAdvancedAnalytics()}
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OrganizationOverview />
          </TabsContent>

          <TabsContent value="branding" className="mt-6">
            <OrganizationBrandingPanel />
          </TabsContent>

          <TabsContent value="frameworks" className="mt-6">
            {organization && (
              <OrganizationPageFrameworks 
                organization={organization}
                onUpdate={handleUpdateOrganization}
              />
            )}
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <OrganizationFeatureStatus />
          </TabsContent>

          <TabsContent value="jobs" className="mt-6">
            <FeatureGuard 
              feature="meta_integration" 
              featureName="Job Management"
              showUpgrade={false}
            >
              <OrganizationJobManagement />
            </FeatureGuard>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <OrganizationUserManagement />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <FeatureGuard 
              feature="openai_access"
              featureName="AI Features"
              showUpgrade={false}
              fallback={
                <FeatureGuard feature="anthropic_access" featureName="AI Features">
                  <AIFeaturesPanel />
                </FeatureGuard>
              }
            >
              <AIFeaturesPanel />
            </FeatureGuard>
          </TabsContent>

          <TabsContent value="tenstreet" className="mt-6">
            <FeatureGuard 
              feature="tenstreet_access"
              featureName="Tenstreet Integration"
            >
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Share2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-medium mb-2">Tenstreet Integration Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Your organization has access to Tenstreet ATS integration features.
                  </p>
                </div>
              </div>
            </FeatureGuard>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <FeatureGuard 
              feature="advanced_analytics"
              featureName="Advanced Analytics"
            >
              <DashboardTabs activeTab="dashboard" onTabChange={() => {}} />
            </FeatureGuard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};