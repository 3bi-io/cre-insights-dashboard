import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllFeatures, 
  getFeaturesByCategory, 
  getFeatureIcon,
  getCategoryColor
} from '@/features/organizations/config/organizationFeatures.config';
import type { FeatureConfig } from '@/features/organizations/types/features.types';

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: {
    features?: Record<string, boolean>;
  };
  subscription_status?: string;
}

interface OrganizationFeatureManagementProps {
  organization: Organization;
  onUpdate: (organizationId: string, settings: any) => void;
}

// Category display order and icons
const CATEGORY_CONFIG: Record<string, { label: string; order: number }> = {
  'AI': { label: 'AI & Machine Learning', order: 1 },
  'Integration': { label: 'Platform Integrations', order: 2 },
  'Screening': { label: 'Screening & Compliance', order: 3 },
  'Advertising': { label: 'Advertising', order: 4 },
  'Analytics': { label: 'Analytics & Reporting', order: 5 },
};

export const OrganizationFeatureManagement = ({ organization, onUpdate }: OrganizationFeatureManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [features, setFeatures] = useState<Record<string, boolean>>(organization.settings?.features || {});
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Get all features from centralized config
  const allFeatures = getAllFeatures();
  const featuresByCategory = getFeaturesByCategory();

  const handleFeatureToggle = (featureKey: string, enabled: boolean) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: enabled
    }));
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const updatedSettings = {
        ...organization.settings,
        features: features
      };
      
      await onUpdate(organization.id, updatedSettings);
      
      toast({
        title: "Features Updated",
        description: `Successfully updated features for ${organization.name}`,
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update organization features. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getEnabledFeatures = () => {
    return allFeatures.filter(feature => features[feature.key]);
  };

  // Sort categories by order
  const sortedCategories = Object.entries(featuresByCategory)
    .sort(([a], [b]) => {
      const orderA = CATEGORY_CONFIG[a]?.order ?? 99;
      const orderB = CATEGORY_CONFIG[b]?.order ?? 99;
      return orderA - orderB;
    });

  const renderFeatureCard = (feature: FeatureConfig) => {
    const Icon = getFeatureIcon(feature.key);
    const isEnabled = !!features[feature.key];
    
    return (
      <Card key={feature.key} className={`p-4 ${isEnabled ? 'border-primary/20 bg-primary/5' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{feature.label}</span>
                {feature.premium && (
                  <Badge variant="outline" className="text-xs">
                    Premium
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
          />
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Manage Features
          <Badge variant="secondary" className="ml-2">
            {getEnabledFeatures().length}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Feature Management - {organization.name}
          </DialogTitle>
          <DialogDescription>
            Configure which platform features and API resources this organization can access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {sortedCategories.map(([category, categoryFeatures], index) => (
            <React.Fragment key={category}>
              {index > 0 && <Separator />}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {CATEGORY_CONFIG[category]?.label || category}
                  <Badge variant="outline" className={`text-xs ${getCategoryColor(category)}`}>
                    {categoryFeatures.length}
                  </Badge>
                </h3>
                <div className="grid gap-4">
                  {categoryFeatures.map(renderFeatureCard)}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};