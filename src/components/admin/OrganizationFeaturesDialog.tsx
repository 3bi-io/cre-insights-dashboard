import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Bot, Megaphone, Share2, BarChart3, Mic } from 'lucide-react';
import { useOrganizationFeaturesAdmin } from '@/hooks/useOrganizationFeaturesAdmin';

interface Organization {
  id: string;
  name: string;
}

interface OrganizationFeaturesDialogProps {
  organization: Organization;
  trigger?: React.ReactNode;
}

const getFeatureIcon = (featureName: string) => {
  switch (featureName) {
    case 'openai_access':
    case 'anthropic_access':
      return Bot;
    case 'meta_integration':
      return Megaphone;
    case 'tenstreet_access':
      return Share2;
    case 'advanced_analytics':
      return BarChart3;
    case 'voice_agent':
      return Mic;
    default:
      return Settings;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'AI':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'Advertising':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Integration':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Analytics':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const OrganizationFeaturesDialog = ({ organization, trigger }: OrganizationFeaturesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});

  const { features, availableFeatures, isLoading, updateFeatures, isUpdating } = useOrganizationFeaturesAdmin(organization.id);

  useEffect(() => {
    if (features.length > 0) {
      const states = features.reduce((acc, feature) => {
        acc[feature.feature_name] = feature.enabled;
        return acc;
      }, {} as Record<string, boolean>);
      setFeatureStates(states);
    }
  }, [features]);

  const handleFeatureToggle = (featureName: string, enabled: boolean) => {
    setFeatureStates(prev => ({ ...prev, [featureName]: enabled }));
  };

  const handleSave = () => {
    const featureUpdates = Object.entries(featureStates).reduce((acc, [featureName, enabled]) => {
      acc[featureName] = { enabled };
      return acc;
    }, {} as Record<string, { enabled: boolean }>);

    updateFeatures({
      orgId: organization.id,
      features: featureUpdates,
    });

    setOpen(false);
  };

  const hasChanges = () => {
    return features.some(feature => 
      featureStates[feature.feature_name] !== feature.enabled
    );
  };

  const featuresByCategory = availableFeatures.reduce((acc: Record<string, any[]>, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Features - {organization.name}</DialogTitle>
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
                    const Icon = getFeatureIcon(feature.name);
                    const isEnabled = featureStates[feature.name] ?? false;
                    
                    return (
                      <div key={feature.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={feature.name} className="font-medium cursor-pointer">
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
                          id={feature.name}
                          checked={isEnabled}
                          onCheckedChange={(checked) => handleFeatureToggle(feature.name, checked)}
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