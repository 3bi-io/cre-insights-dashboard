import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import { Truck, Globe, FileText, DollarSign, Building2, Info, Zap } from 'lucide-react';

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

const AVAILABLE_PLATFORMS = [
  {
    name: 'Google Jobs',
    key: 'google-jobs',
    icon: FileText,
    category: 'General',
    description: 'Google for Jobs integration with XML feeds'
  },
  {
    name: 'Indeed',
    key: 'indeed',
    icon: Globe,
    category: 'General',
    description: 'Indeed job board integration'
  },
  {
    name: 'Meta',
    key: 'meta',
    icon: Globe,
    category: 'Social Media',
    description: 'Facebook and Instagram job ads'
  },
  {
    name: 'Craigslist',
    key: 'craigslist',
    icon: DollarSign,
    category: 'Classifieds',
    description: 'Free local job postings via RSS feed'
  },
  {
    name: 'SimplyHired',
    key: 'simplyhired',
    icon: Globe,
    category: 'General',
    description: 'Free job aggregator network'
  },
  {
    name: 'Glassdoor',
    key: 'glassdoor',
    icon: Building2,
    category: 'Reviews',
    description: 'Company reviews and job platform'
  },
  {
    name: 'Truck Driver Jobs 411',
    key: 'truck-driver-jobs-411',
    icon: Truck,
    category: 'Trucking',
    description: 'Free CDL-focused job board'
  },
  {
    name: 'NewJobs4You',
    key: 'newjobs4you',
    icon: Truck,
    category: 'Transportation',
    description: 'Free transportation jobs board'
  },
  {
    name: 'RoadWarriors',
    key: 'roadwarriors',
    icon: Truck,
    category: 'Trucking',
    description: 'Free trucking community and jobs'
  },
  {
    name: 'ATS Explorer',
    key: 'ats_explorer',
    icon: Zap,
    category: 'Admin Tools',
    description: 'Advanced ATS API exploration and testing tool for Tenstreet integration'
  },
  {
    name: 'Import Applications',
    key: 'import_applications',
    icon: FileText,
    category: 'Admin Tools',
    description: 'Bulk import applications via CSV upload for administrators'
  }
];

const OrganizationPlatformAccessDialog: React.FC<OrganizationPlatformAccessDialogProps> = ({
  open,
  onOpenChange,
  organization
}) => {
  const [localAccess, setLocalAccess] = useState<Record<string, boolean>>({});
  const { 
    organizationPlatformAccess, 
    isLoadingOrgAccess, 
    setPlatformAccess, 
    isUpdating 
  } = usePlatformAccess(organization?.id);

  // Initialize local state when data loads
  useEffect(() => {
    if (organizationPlatformAccess && organization) {
      const accessMap: Record<string, boolean> = {};
      
      // Default all platforms to enabled
      AVAILABLE_PLATFORMS.forEach(platform => {
        accessMap[platform.key] = true;
      });
      
      // Override with actual access settings
      organizationPlatformAccess.forEach((access: any) => {
        accessMap[access.platform_name] = access.enabled;
      });
      
      setLocalAccess(accessMap);
    }
  }, [organizationPlatformAccess, organization]);

  const handleTogglePlatform = (platformKey: string, enabled: boolean) => {
    if (!organization) return;

    setLocalAccess(prev => ({
      ...prev,
      [platformKey]: enabled
    }));

    setPlatformAccess(organization.id, platformKey, enabled);
  };

  const getCategoryPlatforms = (category: string) => {
    return AVAILABLE_PLATFORMS.filter(platform => platform.category === category);
  };

  const categories = [...new Set(AVAILABLE_PLATFORMS.map(p => p.category))];

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

        {isLoadingOrgAccess ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Toggle platforms on/off to control what {organization.name} can access. 
                Changes take effect immediately.
              </AlertDescription>
            </Alert>

            {categories.map(category => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{category} Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {getCategoryPlatforms(category).map(platform => {
                      const IconComponent = platform.icon;
                      const isEnabled = localAccess[platform.key] ?? true;
                      
                      return (
                        <div
                          key={platform.key}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isEnabled 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{platform.name}</h4>
                                <Badge 
                                  variant={isEnabled ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {isEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {platform.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => 
                              handleTogglePlatform(platform.key, checked)
                            }
                            disabled={isUpdating}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationPlatformAccessDialog;