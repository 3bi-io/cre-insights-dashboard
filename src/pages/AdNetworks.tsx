import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlatforms } from '@/hooks/usePlatforms';
import PlatformsTable from '@/components/platforms/PlatformsTable';
import AddPlatformDialog from '@/components/platforms/AddPlatformDialog';
import TalrooPlatformActions from '@/components/platforms/TalrooPlatformActions';
import { PlatformAccessGuard } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, TrendingUp, Plus } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { TenstreetNavigationCard } from '@/components/admin/TenstreetNavigationCard';

const AdNetworks = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const {
    platforms,
    isLoading,
    refetch
  } = usePlatforms();

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    refetch();
    toast({
      title: "Success",
      description: "Ad network added successfully",
    });
  };

  const xPlatformConfigured = platforms?.some(p => 
    (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint
  );

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4 min-w-[200px]"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout 
      title="Ad Networks" 
      description="Manage paid advertising platforms for job distribution"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
                  Ad Networks
                </h1>
                {xPlatformConfigured && (
                  <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    X API Active
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Manage paid advertising platforms • {platforms?.length || 0} configured
                {xPlatformConfigured && ' • Enhanced X integration enabled'}
              </p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="flex items-center gap-2 flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" />
                <span>Add Network</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="talroo" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Talroo
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ATS Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <PlatformsTable
              platforms={platforms}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="talroo" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="talroo">
              <TalrooPlatformActions />
            </PlatformAccessGuard>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <TenstreetNavigationCard />
          </TabsContent>
        </Tabs>

        {showAddDialog && (
          <AddPlatformDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSuccess={handleAddSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AdNetworks;
