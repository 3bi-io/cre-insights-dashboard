import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Bot,
  Phone,
  BarChart3,
  Share2,
  Zap,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Organization {
  id: string;
  name: string;
  slug: string;
  settings?: {
    features?: {
      tenstreet_access?: boolean;
      openai_access?: boolean;
      anthropic_access?: boolean;
      meta_integration?: boolean;
      voice_agent?: boolean;
      advanced_analytics?: boolean;
      elevenlabs_access?: boolean;
    };
  };
  subscription_status?: string;
}

interface OrganizationFeatureManagementProps {
  organization: Organization;
  onUpdate: (organizationId: string, settings: any) => void;
}

const AVAILABLE_FEATURES = [
  {
    key: 'tenstreet_access',
    name: 'Tenstreet Integration',
    description: 'Access to Tenstreet ATS integration and applicant management',
    icon: Share2,
    category: 'integrations',
    premium: true
  },
  {
    key: 'openai_access',
    name: 'OpenAI API Access',
    description: 'Access to GPT models for AI-powered features and chat',
    icon: Bot,
    category: 'ai',
    premium: true
  },
  {
    key: 'anthropic_access',
    name: 'Anthropic API Access',
    description: 'Access to Claude models for advanced AI analytics',
    icon: Zap,
    category: 'ai',
    premium: true
  },
  {
    key: 'elevenlabs_access',
    name: 'ElevenLabs Voice AI',
    description: 'Access to voice synthesis and speech-to-text features',
    icon: Phone,
    category: 'ai',
    premium: true
  },
  {
    key: 'meta_integration',
    name: 'Meta Advertising',
    description: 'Facebook and Instagram advertising campaign management',
    icon: Share2,
    category: 'integrations',
    premium: false
  },
  {
    key: 'voice_agent',
    name: 'Voice Agent',
    description: 'AI-powered voice agent for applicant screening',
    icon: Phone,
    category: 'ai',
    premium: true
  },
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed reporting and AI-powered insights dashboard',
    icon: BarChart3,
    category: 'analytics',
    premium: false
  }
];

export const OrganizationFeatureManagement = ({ organization, onUpdate }: OrganizationFeatureManagementProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [features, setFeatures] = useState(organization.settings?.features || {});
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

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
    return AVAILABLE_FEATURES.filter(feature => features[feature.key]);
  };

  const getCategoryFeatures = (category: string) => {
    return AVAILABLE_FEATURES.filter(feature => feature.category === category);
  };

  const isCrEngland = organization.slug === 'cr-england';

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

        {isCrEngland && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription>
              <strong>Primary Client:</strong> CR England retains access to all premium features including Tenstreet integration.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* AI & ML Features */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI & Machine Learning
            </h3>
            <div className="grid gap-4">
              {getCategoryFeatures('ai').map((feature) => {
                const Icon = feature.icon;
                const isEnabled = features[feature.key] || (isCrEngland && feature.key === 'tenstreet_access');
                const isLocked = isCrEngland && feature.key === 'tenstreet_access';
                
                return (
                  <Card key={feature.key} className={`p-4 ${isEnabled ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feature.name}</span>
                            {feature.premium && (
                              <Badge variant="outline" className="text-xs">
                                Premium
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
                        disabled={isLocked}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Integrations */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Platform Integrations
            </h3>
            <div className="grid gap-4">
              {getCategoryFeatures('integrations').map((feature) => {
                const Icon = feature.icon;
                const isEnabled = features[feature.key] || (isCrEngland && feature.key === 'tenstreet_access');
                const isLocked = isCrEngland && feature.key === 'tenstreet_access';
                
                return (
                  <Card key={feature.key} className={`p-4 ${isEnabled ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feature.name}</span>
                            {feature.premium && (
                              <Badge variant="outline" className="text-xs">
                                Premium
                              </Badge>
                            )}
                            {isLocked && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.key, checked)}
                        disabled={isLocked}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Analytics */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics & Reporting
            </h3>
            <div className="grid gap-4">
              {getCategoryFeatures('analytics').map((feature) => {
                const Icon = feature.icon;
                const isEnabled = features[feature.key];
                
                return (
                  <Card key={feature.key} className={`p-4 ${isEnabled ? 'border-primary/20 bg-primary/5' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{feature.name}</span>
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
              })}
            </div>
          </div>
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