import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganizationFeaturesAdmin } from '@/hooks/useOrganizationFeaturesAdmin';
import { Settings } from 'lucide-react';
import {
  getFeatureIcon,
  getCategoryColor,
  getFeaturesByCategory,
} from '@/features/organizations/config/organizationFeatures.config';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationFeaturesDialogProps {
  organization: Organization;
  trigger?: React.ReactNode;
}

export const OrganizationFeaturesDialog = ({ organization, trigger }: OrganizationFeaturesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});

  const { features, availableFeatures, isLoading, updateFeatures, isUpdating } = useOrganizationFeaturesAdmin(organization.id);

  useEffect(() => {
    // Initialize all available features with their current state from DB or default to false
    const states = availableFeatures.reduce((acc, feature) => {
      const existingFeature = features.find(f => f.feature_name === feature.key);
      acc[feature.key] = existingFeature ? existingFeature.enabled : false;
      return acc;
    }, {} as Record<string, boolean>);
    setFeatureStates(states);
  }, [features, availableFeatures]);

  const handleFeatureToggle = (featureName: string, enabled: boolean) => {
    setFeatureStates(prev => ({ ...prev, [featureName]: enabled }));
  };

  const handleSave = async () => {
    // Send all available features with their current states
    const featureUpdates = availableFeatures.reduce((acc, feature) => {
      acc[feature.key] = { enabled: featureStates[feature.key] ?? false };
      return acc;
    }, {} as Record<string, { enabled: boolean }>);

    try {
      await updateFeatures({
        orgId: organization.id,
        features: featureUpdates,
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to update features:', error);
    }
  };

  const hasChanges = () => {
    // Check if any feature state differs from its database state
    return availableFeatures.some(feature => {
      const existingFeature = features.find(f => f.feature_name === feature.key);
      const currentState = featureStates[feature.key] ?? false;
      const originalState = existingFeature ? existingFeature.enabled : false;
      return currentState !== originalState;
    });
  };

  const featuresByCategory = getFeaturesByCategory();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            Manage Features
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Manage Features - {organization.name}
          </DialogTitle>
          <DialogDescription>
            Control which features are available to this organization.
            Disabled features will not be accessible to users.
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
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Toggle features on/off to control what {organization.name} can access. Click "Save Changes" to apply your changes.
              </AlertDescription>
            </Alert>

            {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                  <Badge variant="outline" className={getCategoryColor(category)}>
                    {categoryFeatures.length} feature{categoryFeatures.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  {categoryFeatures.map((feature) => {
                    const Icon = getFeatureIcon(feature.key);
                    const isEnabled = featureStates[feature.key] ?? false;
                    
                    return (
                      <div key={feature.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                                {feature.label}
                              </Label>
                              {isEnabled && (
                                <Badge variant="secondary" className="text-xs">
                                  Enabled
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={feature.key}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {category !== Object.keys(featuresByCategory)[Object.keys(featuresByCategory).length - 1] && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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