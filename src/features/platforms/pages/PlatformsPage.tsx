import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlatforms } from '@/hooks/usePlatforms';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, FileText, Settings } from 'lucide-react';

import { PageLayout } from '@/features/shared';
import {
  PlatformsHeader,
  PlatformsTable,
  AddPlatformDialog,
  GoogleJobsPlatformActions,
  MetaPlatformActions
} from '../components';

const PlatformsPage = () => {
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
      <PageLayout title="Platforms" description="Manage your job posting platforms and integrations">
        <div className="p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 min-w-[200px]"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Platforms" 
      description="Manage your job posting platforms and integrations"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <PlatformsHeader
          platformsCount={platforms?.length || 0}
          showAddDialog={showAddDialog}
          onShowAddDialog={setShowAddDialog}
          onAddSuccess={handleAddSuccess}
          platforms={platforms}
        />

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="feeds" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Feeds & XML
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <PlatformsTable platforms={platforms || []} />
          </TabsContent>

          <TabsContent value="feeds" className="mt-6">
            <div className="grid gap-6">
              <GoogleJobsPlatformActions />
              <MetaPlatformActions />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="text-center py-12">
              <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Platform Settings</h3>
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
    </PageLayout>
  );
};

export default PlatformsPage;