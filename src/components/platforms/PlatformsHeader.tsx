
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import AddPlatformDialog from './AddPlatformDialog';

interface PlatformsHeaderProps {
  platformsCount: number;
  showAddDialog: boolean;
  onShowAddDialog: (show: boolean) => void;
  onAddSuccess: () => void;
}

const PlatformsHeader: React.FC<PlatformsHeaderProps> = ({
  platformsCount,
  showAddDialog,
  onShowAddDialog,
  onAddSuccess
}) => {
  return (
    <div className="flex flex-col gap-4 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
            Advertising Platforms
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your advertising platforms • {platformsCount} platforms
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => onShowAddDialog(true)}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Add Platform</span>
          </Button>
        </div>
      </div>

      <AddPlatformDialog
        open={showAddDialog}
        onOpenChange={onShowAddDialog}
        onSuccess={onAddSuccess}
      />
    </div>
  );
};

export default PlatformsHeader;
