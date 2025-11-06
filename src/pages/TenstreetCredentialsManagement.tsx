import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CredentialsStatsCards } from '@/components/tenstreet/CredentialsStatsCards';
import { CredentialsManagementTable } from '@/components/tenstreet/CredentialsManagementTable';
import TenstreetCredentialsDialog from '@/components/applications/TenstreetCredentialsDialog';
import { useTenstreetCredentialsManagement } from '@/hooks/useTenstreetCredentialsManagement';
import { TenstreetCredentialsService } from '@/services/tenstreetCredentialsService';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TenstreetCredentialsManagement() {
  const { organizations, summary, isLoading, refetch } = useTenstreetCredentialsManagement();
  const { toast } = useToast();
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  const handleConfigure = (organizationId: string) => {
    setSelectedOrgId(organizationId);
    setIsCredentialsDialogOpen(true);
  };

  const handleExport = () => {
    try {
      TenstreetCredentialsService.exportToCSV(organizations);
      toast({
        title: 'Export successful',
        description: 'Configuration report has been downloaded.',
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export configuration report.',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: 'Refreshed',
      description: 'Organization data has been updated.',
    });
  };

  return (
    <>
      <Helmet>
        <title>Tenstreet Credentials Management - ATS Integration</title>
        <meta
          name="description"
          content="Manage Tenstreet ATS credentials for all organizations. Monitor connection health and sync status."
        />
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tenstreet Credentials Management</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage Tenstreet ATS credentials across all organizations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <CredentialsStatsCards
            totalOrganizations={summary?.totalOrganizations || 0}
            configuredOrganizations={summary?.configuredOrganizations || 0}
            pendingConfiguration={summary?.pendingConfiguration || 0}
            recentSyncActivity={summary?.recentSyncActivity || 0}
            isLoading={isLoading}
          />
        )}

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              View and manage Tenstreet credentials for each organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <CredentialsManagementTable
                organizations={organizations}
                onConfigure={handleConfigure}
              />
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              About Connection Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-600 dark:text-green-400">Active:</span>
              <span>Credentials configured and successful sync within the last 7 days</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">Inactive:</span>
              <span>Credentials configured but no sync activity for 7+ days</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-red-600 dark:text-red-400">Error:</span>
              <span>Credentials are inactive or connection has failed</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-muted-foreground">Unknown:</span>
              <span>No credentials have been configured for this organization</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Dialog */}
      <TenstreetCredentialsDialog
        open={isCredentialsDialogOpen}
        onOpenChange={(open) => {
          setIsCredentialsDialogOpen(open);
          if (!open) {
            setSelectedOrgId(null);
            refetch(); // Refresh data after dialog closes
          }
        }}
        initialOrganizationId={selectedOrgId}
      />
    </>
  );
}
