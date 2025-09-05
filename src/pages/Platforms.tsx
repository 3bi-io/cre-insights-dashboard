
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlatforms } from '@/hooks/usePlatforms';
import PlatformsHeader from '@/components/platforms/PlatformsHeader';
import PlatformsTable from '@/components/platforms/PlatformsTable';
import AddPlatformDialog from '@/components/platforms/AddPlatformDialog';
import GoogleJobsPlatformActions from '@/components/platforms/GoogleJobsPlatformActions';
import MetaPlatformActions from '@/components/platforms/MetaPlatformActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, FileText, Settings } from 'lucide-react';

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
      description: "Platform added successfully",
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PlatformsHeader
        platformsCount={platforms?.length || 0}
        showAddDialog={showAddDialog}
        onShowAddDialog={setShowAddDialog}
        onAddSuccess={handleAddSuccess}
        platforms={platforms}
      />

      <Tabs defaultValue="platforms" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <img src="/lovable-uploads/9d2222a9-c812-4222-ba8e-20535dc278b6.png" alt="Meta" className="w-4 h-4" />
            Meta API
          </TabsTrigger>
          <TabsTrigger value="google-jobs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Google Jobs
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-6 mt-6">
          <PlatformsTable
            platforms={platforms}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="meta" className="space-y-6 mt-6">
          {platforms?.find(p => p.name.toLowerCase().includes('meta')) && (
            <MetaPlatformActions 
              platform={platforms.find(p => p.name.toLowerCase().includes('meta'))!}
              onRefresh={refetch}
            />
          )}
        </TabsContent>

        <TabsContent value="google-jobs" className="space-y-6 mt-6">
          <GoogleJobsPlatformActions />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <div className="text-center py-12">
            <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Platform settings coming soon</p>
          </div>
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
  );
};

export default Platforms;
