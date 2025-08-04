
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap } from 'lucide-react';
import AddPlatformDialog from './AddPlatformDialog';

interface PlatformsHeaderProps {
  platformsCount: number;
  showAddDialog: boolean;
  onShowAddDialog: (show: boolean) => void;
  onAddSuccess: () => void;
  platforms?: Array<{ name: string; api_endpoint: string | null; }>;
}

const PlatformsHeader: React.FC<PlatformsHeaderProps> = ({
  platformsCount,
  showAddDialog,
  onShowAddDialog,
  onAddSuccess,
  platforms = []
}) => {
  const xPlatformConfigured = platforms.some(p => 
    (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint
  );
  return (
    <div className="flex flex-col gap-4 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
              Advertising Platforms
            </h1>
            {xPlatformConfigured && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <Zap className="w-3 h-3" />
                X API Active
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your advertising platforms • 6
            {xPlatformConfigured && ' • Enhanced X integration enabled'}
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
