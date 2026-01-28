import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { useSocialBeaconSettings, type SocialBeaconSettings } from '../../hooks/useSocialBeaconSettings';

interface GlobalSettingsPanelProps {
  organizationId?: string | null;
}

export function GlobalSettingsPanel({ organizationId = null }: GlobalSettingsPanelProps) {
  const { 
    settings, 
    isLoading, 
    saveSettings, 
    resetToDefaults,
    defaultSettings 
  } = useSocialBeaconSettings(organizationId);
  
  const [localSettings, setLocalSettings] = useState<SocialBeaconSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when settings load
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings);
    setHasChanges(changed);
  }, [localSettings, settings]);

  const updateSetting = <K extends keyof SocialBeaconSettings>(
    key: K, 
    value: SocialBeaconSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTemplate = (key: keyof SocialBeaconSettings['templates'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      templates: { ...prev.templates, [key]: value }
    }));
  };

  const handleSave = () => {
    saveSettings.mutate(localSettings);
  };

  const handleReset = () => {
    setLocalSettings(defaultSettings);
    resetToDefaults.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Global Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure default behaviors and templates for social engagement across all platforms
          </p>
        </div>
        {hasChanges && (
          <span className="text-sm text-warning font-medium">Unsaved changes</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Auto-Engage Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Auto-Engage Defaults</CardTitle>
            <CardDescription>
              Default settings for automated responses and engagement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Auto-Respond</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically respond to common inquiries
                </p>
              </div>
              <Switch 
                checked={localSettings.autoRespondEnabled}
                onCheckedChange={(checked) => updateSetting('autoRespondEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Human Review Required</Label>
                <p className="text-xs text-muted-foreground">
                  Queue responses for review before sending
                </p>
              </div>
              <Switch 
                checked={localSettings.humanReviewRequired}
                onCheckedChange={(checked) => updateSetting('humanReviewRequired', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>Response Delay (seconds)</Label>
              <Input 
                type="number" 
                value={localSettings.responseDelaySeconds}
                onChange={(e) => updateSetting('responseDelaySeconds', parseInt(e.target.value) || 0)}
                min={0} 
                max={300} 
              />
              <p className="text-xs text-muted-foreground">
                Wait time before auto-responding (more natural)
              </p>
            </div>

            <div className="space-y-2">
              <Label>AI Confidence Threshold</Label>
              <Select 
                value={localSettings.aiConfidenceThreshold.toString()}
                onValueChange={(value) => updateSetting('aiConfidenceThreshold', parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.6">60% - More Responses</SelectItem>
                  <SelectItem value="0.7">70% - Balanced</SelectItem>
                  <SelectItem value="0.8">80% - Conservative</SelectItem>
                  <SelectItem value="0.9">90% - Very Strict</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Minimum confidence required for auto-responses
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branding Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branding & Voice</CardTitle>
            <CardDescription>
              Customize the tone and branding for generated content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input 
                placeholder="Your Company Name" 
                value={localSettings.companyName}
                onChange={(e) => updateSetting('companyName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Voice</Label>
              <Select 
                value={localSettings.brandVoice}
                onValueChange={(value) => updateSetting('brandVoice', value as SocialBeaconSettings['brandVoice'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="authoritative">Authoritative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Hashtags</Label>
              <Input 
                placeholder="#CDLJobs #TruckDrivers #Hiring" 
                value={localSettings.defaultHashtags}
                onChange={(e) => updateSetting('defaultHashtags', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated hashtags to include in all posts
              </p>
            </div>

            <div className="space-y-2">
              <Label>Call-to-Action URL</Label>
              <Input 
                placeholder="https://apply.yourcompany.com" 
                value={localSettings.callToActionUrl}
                onChange={(e) => updateSetting('callToActionUrl', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Default Templates */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Default Response Templates</CardTitle>
            <CardDescription>
              Fallback templates when AI-generated responses are not available
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Job Inquiry Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="Thanks for your interest! Apply at {apply_url} or call {phone}."
                  value={localSettings.templates.jobInquiry}
                  onChange={(e) => updateTemplate('jobInquiry', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Salary Question Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="Great question! Contact us at {phone} for specific details."
                  value={localSettings.templates.salaryQuestion}
                  onChange={(e) => updateTemplate('salaryQuestion', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Benefits Question Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="We offer full benefits. Learn more at {website}."
                  value={localSettings.templates.benefitsQuestion}
                  onChange={(e) => updateTemplate('benefitsQuestion', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>General Inquiry Response</Label>
                <Textarea 
                  rows={3}
                  placeholder="Thanks for reaching out! Visit {website} or call {phone}."
                  value={localSettings.templates.generalInquiry}
                  onChange={(e) => updateTemplate('generalInquiry', e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || saveSettings.isPending}
              >
                {saveSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Settings
              </Button>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={resetToDefaults.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
