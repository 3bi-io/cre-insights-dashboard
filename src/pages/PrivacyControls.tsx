import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Database, 
  Brain, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrivacySettings {
  id: string;
  userId: string;
  dataProcessingLevel: 'restricted' | 'sensitive' | 'internal' | 'public';
  allowAIProcessing: boolean;
  sharePersonalInfo: boolean;
  shareContactInfo: boolean;
  shareLocationData: boolean;
  shareExperienceData: boolean;
  auditLogging: boolean;
  dataRetentionDays: number;
  anonymizeAfterDays: number;
  thirdPartySharing: boolean;
  biasMonitoring: boolean;
  explainabilityRequired: boolean;
  updatedAt: string;
}

const PrivacyControlsPage = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadPrivacySettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // In a real app, this would fetch from a privacy_settings table
      // For now, we'll use mock data
      const mockSettings: PrivacySettings = {
        id: 'mock-id',
        userId: user.id,
        dataProcessingLevel: 'internal',
        allowAIProcessing: true,
        sharePersonalInfo: false,
        shareContactInfo: false,
        shareLocationData: true,
        shareExperienceData: true,
        auditLogging: true,
        dataRetentionDays: 90,
        anonymizeAfterDays: 365,
        thirdPartySharing: false,
        biasMonitoring: true,
        explainabilityRequired: true,
        updatedAt: new Date().toISOString()
      };

      setSettings(mockSettings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // In a real app, this would save to the database
      console.log('Saving privacy settings:', settings);
      
      toast({
        title: "Settings Saved",
        description: "Your privacy preferences have been updated",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PrivacySettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value,
      updatedAt: new Date().toISOString()
    });
  };

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const getDataLevelDescription = (level: string) => {
    switch (level) {
      case 'public':
        return 'No restrictions - data can be used for all AI processing';
      case 'internal':
        return 'Limited sharing - data used only within our organization';
      case 'sensitive':
        return 'High protection - PII removed before AI processing';
      case 'restricted':
        return 'Maximum protection - no AI processing of personal data';
      default:
        return '';
    }
  };

  const getDataLevelColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'bg-blue-100 text-blue-800';
      case 'internal':
        return 'bg-green-100 text-green-800';
      case 'sensitive':
        return 'bg-yellow-100 text-yellow-800';
      case 'restricted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading privacy settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Unable to load privacy settings</p>
              <Button onClick={loadPrivacySettings} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Controls</h1>
            <p className="text-muted-foreground">
              Manage how your data is processed and shared with AI systems
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className={getDataLevelColor(settings.dataProcessingLevel)}>
              {settings.dataProcessingLevel.toUpperCase()} Protection
            </Badge>
            <Button onClick={savePrivacySettings} disabled={saving}>
              {saving ? <Settings className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Data Processing Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Protection Level
            </CardTitle>
            <CardDescription>
              Choose how your applicant data should be handled by AI systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select 
                value={settings.dataProcessingLevel}
                onValueChange={(value) => updateSetting('dataProcessingLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - No restrictions</SelectItem>
                  <SelectItem value="internal">Internal - Limited sharing</SelectItem>
                  <SelectItem value="sensitive">Sensitive - High protection</SelectItem>
                  <SelectItem value="restricted">Restricted - Maximum protection</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {getDataLevelDescription(settings.dataProcessingLevel)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Processing Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Processing Controls
            </CardTitle>
            <CardDescription>
              Configure which AI features can access your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Allow AI Processing</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable AI-powered insights and recommendations for your applications</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable AI analysis of application data
                  </p>
                </div>
                <Switch
                  checked={settings.allowAIProcessing}
                  onCheckedChange={(checked) => updateSetting('allowAIProcessing', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Bias Monitoring</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Monitor AI decisions for potential bias and discrimination</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Monitor AI decisions for bias
                  </p>
                </div>
                <Switch
                  checked={settings.biasMonitoring}
                  onCheckedChange={(checked) => updateSetting('biasMonitoring', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Require Explanations</label>
                  <p className="text-sm text-muted-foreground">
                    Always provide explanations for AI decisions
                  </p>
                </div>
                <Switch
                  checked={settings.explainabilityRequired}
                  onCheckedChange={(checked) => updateSetting('explainabilityRequired', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Sharing Controls
            </CardTitle>
            <CardDescription>
              Control which types of data can be shared with AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Personal Information</label>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Names, email addresses, phone numbers
                  </p>
                </div>
                <Switch
                  checked={settings.sharePersonalInfo}
                  onCheckedChange={(checked) => updateSetting('sharePersonalInfo', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Contact Information</label>
                  <p className="text-sm text-muted-foreground">
                    Email and phone data for analysis
                  </p>
                </div>
                <Switch
                  checked={settings.shareContactInfo}
                  onCheckedChange={(checked) => updateSetting('shareContactInfo', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Location Data</label>
                  <p className="text-sm text-muted-foreground">
                    City, state, and geographic analysis
                  </p>
                </div>
                <Switch
                  checked={settings.shareLocationData}
                  onCheckedChange={(checked) => updateSetting('shareLocationData', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Experience Data</label>
                  <p className="text-sm text-muted-foreground">
                    Work history and qualifications
                  </p>
                </div>
                <Switch
                  checked={settings.shareExperienceData}
                  onCheckedChange={(checked) => updateSetting('shareExperienceData', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Data Retention & Security
            </CardTitle>
            <CardDescription>
              Configure how long data is retained and security measures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Retention (Days)</label>
                  <Select 
                    value={settings.dataRetentionDays.toString()}
                    onValueChange={(value) => updateSetting('dataRetentionDays', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Anonymize After (Days)</label>
                  <Select 
                    value={settings.anonymizeAfterDays.toString()}
                    onValueChange={(value) => updateSetting('anonymizeAfterDays', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1095">3 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Audit Logging</label>
                  <p className="text-sm text-muted-foreground">
                    Track all AI decisions and data access
                  </p>
                </div>
                <Switch
                  checked={settings.auditLogging}
                  onCheckedChange={(checked) => updateSetting('auditLogging', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Third-Party Sharing</label>
                  <p className="text-sm text-muted-foreground">
                    Allow sharing anonymized data with partners
                  </p>
                </div>
                <Switch
                  checked={settings.thirdPartySharing}
                  onCheckedChange={(checked) => updateSetting('thirdPartySharing', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default PrivacyControlsPage;