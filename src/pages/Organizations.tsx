import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Shield } from 'lucide-react';
import { useOrganizationsData } from '@/hooks/useAdminDashboardData';
import { CreateOrganizationDialog } from '@/components/admin/CreateOrganizationDialog';
import { EditOrganizationDialog } from '@/components/admin/EditOrganizationDialog';
import { OrganizationFeaturesDialog } from '@/components/admin/OrganizationFeaturesDialog';
import { DeleteOrganizationDialog } from '@/components/admin/DeleteOrganizationDialog';
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';
import { OrganizationPlatformAccessDialog } from '@/components/admin';
import PlanBadge from '@/components/PlanBadge';
import AdminPageLayout from '@/features/shared/components/AdminPageLayout';
import { AdminNavigationDashboard } from '@/components/admin/AdminNavigationDashboard';

const Organizations = () => {
  const { data: organizations, isLoading } = useOrganizationsData();
  const [selectedOrgForPlatforms, setSelectedOrgForPlatforms] = useState<any>(null);
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);

  const handlePlatformAccess = (org: any) => {
    setSelectedOrgForPlatforms(org);
    setShowPlatformDialog(true);
  };

  return (
    <AdminPageLayout
      title="Organizations"
      description="Manage multi-tenant organizations and settings"
      requiredRole="super_admin"
      actions={<CreateOrganizationDialog />}
    >
      <div className="space-y-6">
        {/* Admin Navigation Dashboard */}
        <AdminNavigationDashboard />

        {/* Organizations List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {organizations?.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">No organizations found</p>
                  <CreateOrganizationDialog 
                    trigger={
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Organization
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              organizations?.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-base">{org.name}</CardTitle>
                        <CardDescription>{org.slug}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PlanBadge planType={org.plan_type || 'enterprise'} />
                        <Badge variant={org.subscription_status === 'active' ? 'secondary' : 'outline'}>
                          {org.subscription_status}
                        </Badge>
                        <OrganizationFeaturesDialog organization={org} />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePlatformAccess(org)}
                        >
                          <Shield className="w-4 h-4 mr-1" />
                          Platforms
                        </Button>
                        <EditOrganizationDialog organization={org} />
                        <UserManagementDialog organization={org} />
                        <DeleteOrganizationDialog organization={org} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Users</p>
                        <p className="font-medium">{org.userCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Active Jobs</p>
                        <p className="font-medium">{org.jobCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Applications</p>
                        <p className="font-medium">{org.applicationCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Spend</p>
                        <p className="font-medium">${org.monthlySpend.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      <OrganizationPlatformAccessDialog
        open={showPlatformDialog}
        onOpenChange={setShowPlatformDialog}
        organization={selectedOrgForPlatforms}
      />
    </AdminPageLayout>
  );
};

export default Organizations;
