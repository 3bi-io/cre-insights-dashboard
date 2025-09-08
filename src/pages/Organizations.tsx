import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { useOrganizationsData } from '@/hooks/useAdminDashboardData';
import { CreateOrganizationDialog } from '@/components/admin/CreateOrganizationDialog';
import { EditOrganizationDialog } from '@/components/admin/EditOrganizationDialog';
import { OrganizationFeaturesDialog } from '@/components/admin/OrganizationFeaturesDialog';
import { DeleteOrganizationDialog } from '@/components/admin/DeleteOrganizationDialog';
import { UserManagementDialog } from '@/components/admin/UserManagementDialog';

const Organizations = () => {
  const { userRole } = useAuth();
  const { data: organizations, isLoading } = useOrganizationsData();

  if (userRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You need super admin permissions to access organization management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage multi-tenant organizations and settings.
            <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Organization Management</h3>
            <CreateOrganizationDialog />
          </div>
          
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{org.name}</CardTitle>
                          <CardDescription>{org.slug}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={org.subscription_status === 'active' ? 'secondary' : 'outline'}>
                            {org.subscription_status}
                          </Badge>
                          <OrganizationFeaturesDialog organization={org} />
                          <EditOrganizationDialog organization={org} />
                          <UserManagementDialog organization={org} />
                          <DeleteOrganizationDialog organization={org} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-sm">
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
      </div>
    </div>
  );
};

export default Organizations;