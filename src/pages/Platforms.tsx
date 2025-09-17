
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlatforms } from '@/hooks/usePlatforms';
import PlatformsHeader from '@/components/platforms/PlatformsHeader';
import PlatformsTable from '@/components/platforms/PlatformsTable';
import AddPlatformDialog from '@/components/platforms/AddPlatformDialog';
import GoogleJobsPlatformActions from '@/components/platforms/GoogleJobsPlatformActions';
import MetaPlatformActions from '@/components/platforms/MetaPlatformActions';
import CraigslistPlatformActions from '@/components/platforms/CraigslistPlatformActions';
import SimplyHiredPlatformActions from '@/components/platforms/SimplyHiredPlatformActions';
import GlassdoorPlatformActions from '@/components/platforms/GlassdoorPlatformActions';
import TruckDriverJobs411PlatformActions from '@/components/platforms/TruckDriverJobs411PlatformActions';
import { PlatformAccessGuard } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, FileText, DollarSign, Building2 } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

const Platforms = () => {
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
      description: "Publisher added successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 min-w-[200px]"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout 
      title="Publishers" 
      description="Manage your job posting publishers and integrations"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <PlatformsHeader
          platformsCount={platforms?.length || 0}
          showAddDialog={showAddDialog}
          onShowAddDialog={setShowAddDialog}
          onAddSuccess={handleAddSuccess}
          platforms={platforms}
        />

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Publishers
          </TabsTrigger>
          <TabsTrigger value="trucking" className="flex items-center gap-2">
            <img src="https://cdn-icons-png.flaticon.com/512/1149/1149168.png" alt="Trucking" className="w-4 h-4" />
            CDL Jobs
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <img src="/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png" alt="Meta" className="w-4 h-4" />
            Meta API
          </TabsTrigger>
          <TabsTrigger value="google-jobs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Google Jobs
          </TabsTrigger>
          <TabsTrigger value="craigslist" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Craigslist
          </TabsTrigger>
          <TabsTrigger value="simplyhired" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            SimplyHired
          </TabsTrigger>
          <TabsTrigger value="glassdoor" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Glassdoor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6 mt-6">
          <PlatformsTable
            platforms={platforms}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="meta" className="space-y-6 mt-6">
          <PlatformAccessGuard platformName="meta">
            {platforms?.find(p => p.name.toLowerCase().includes('meta')) && (
              <MetaPlatformActions 
                platform={platforms.find(p => p.name.toLowerCase().includes('meta'))!}
                onRefresh={refetch}
              />
            )}
          </PlatformAccessGuard>
        </TabsContent>

        <TabsContent value="google-jobs" className="space-y-6 mt-6">
          <PlatformAccessGuard platformName="google-jobs">
            <GoogleJobsPlatformActions />
          </PlatformAccessGuard>
        </TabsContent>

        <TabsContent value="craigslist" className="space-y-6 mt-6">
          <PlatformAccessGuard platformName="craigslist">
            <CraigslistPlatformActions />
          </PlatformAccessGuard>
        </TabsContent>

        <TabsContent value="simplyhired" className="space-y-6 mt-6">
          <PlatformAccessGuard platformName="simplyhired">
            <SimplyHiredPlatformActions />
          </PlatformAccessGuard>
        </TabsContent>

        <TabsContent value="glassdoor" className="space-y-6 mt-6">
          <PlatformAccessGuard platformName="glassdoor">
            <GlassdoorPlatformActions />
          </PlatformAccessGuard>
        </TabsContent>

        <TabsContent value="trucking" className="space-y-6 mt-6">
          <PlatformAccessGuard platformName="truck-driver-jobs-411">
            <TruckDriverJobs411PlatformActions />
          </PlatformAccessGuard>
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

export default Platforms;
