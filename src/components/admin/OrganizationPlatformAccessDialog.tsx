import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import { Building2, Info } from 'lucide-react';
import {
  getPlatformIcon,
  getCategoryColor,
  getPlatformsByCategory,
} from '@/features/organizations/config/organizationPlatforms.config';
import { PlatformCategory } from '@/features/organizations/types/platforms.types';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationPlatformAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

const OrganizationPlatformAccessDialog: React.FC<OrganizationPlatformAccessDialogProps> = ({
  open,
  onOpenChange,
  organization
}) => {
  const [platformStates, setPlatformStates] = useState<Record<string, boolean>>({});

  const { platforms, availablePlatforms, isLoading, updatePlatforms, isUpdating } = usePlatformAccess(organization?.id);

  useEffect(() => {
    // Initialize all available platforms with their current state from DB or default to true (enabled)
    if (availablePlatforms.length > 0) {
      const states = availablePlatforms.reduce((acc, platform) => {
        const existingPlatform = platforms.find(p => p.platform_name === platform.key);
        acc[platform.key] = existingPlatform ? existingPlatform.enabled : true;
        return acc;
      }, {} as Record<string, boolean>);
      setPlatformStates(states);
    }
  }, [platforms, availablePlatforms, open]);

  const handlePlatformToggle = (platformName: string, enabled: boolean) => {
    setPlatformStates(prev => ({ ...prev, [platformName]: enabled }));
  };

  const handleSave = async () => {
    if (!organization) return;

    // Send all available platforms with their current states
    const platformUpdates = availablePlatforms.reduce((acc, platform) => {
      acc[platform.key] = { enabled: platformStates[platform.key] ?? true };
      return acc;
    }, {} as Record<string, { enabled: boolean }>);

    try {
      await updatePlatforms({
        orgId: organization.id,
        platforms: platformUpdates,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update platforms:', error);
    }
  };

  const hasChanges = () => {
    // Check if any platform state differs from its database state
    return availablePlatforms.some(platform => {
      const existingPlatform = platforms.find(p => p.platform_name === platform.key);
      const currentState = platformStates[platform.key] ?? true;
      const originalState = existingPlatform ? existingPlatform.enabled : true;
      return currentState !== originalState;
    });
  };

  const platformsByCategory = getPlatformsByCategory();

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Platform Access - {organization.name}
          </DialogTitle>
          <DialogDescription>
            Manage which publishing platforms are available to this organization.
            Disabled platforms will not appear in their platform list.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-48 animate-pulse" />
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-12 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Toggle platforms on/off to control what {organization.name} can access. Click "Save Changes" to apply your changes.
            </AlertDescription>
          </Alert>

            {Object.entries(platformsByCategory).map(([category, categoryPlatforms]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                  <Badge variant="outline" className={getCategoryColor(category as PlatformCategory)}>
                    {categoryPlatforms.length} platform{categoryPlatforms.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {categoryPlatforms.map((platform) => {
                    const Icon = getPlatformIcon(platform.key);
                    const isEnabled = platformStates[platform.key] ?? true;
                    
                    return (
                      <div key={platform.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={platform.key} className="font-medium cursor-pointer">
                                {platform.name}
                              </Label>
                              {isEnabled && (
                                <Badge variant="secondary" className="text-xs">
                                  Enabled
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {platform.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={platform.key}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handlePlatformToggle(platform.key, checked)}
                          disabled={isUpdating}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {category !== Object.keys(platformsByCategory)[Object.keys(platformsByCategory).length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isUpdating || !hasChanges()}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationPlatformAccessDialog;