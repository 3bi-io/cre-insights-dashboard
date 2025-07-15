
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlatforms } from '@/hooks/usePlatforms';
import PlatformsHeader from '@/components/platforms/PlatformsHeader';
import PlatformsTable from '@/components/platforms/PlatformsTable';
import AddPlatformDialog from '@/components/platforms/AddPlatformDialog';

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

      <PlatformsTable
        platforms={platforms}
        onRefresh={refetch}
      />

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
