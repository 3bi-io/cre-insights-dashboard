import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import { useOrganizationFeatures } from '@/hooks/useOrganizationFeatures';
import { Save, Brain, Settings, Shield, BarChart3, Zap } from 'lucide-react';

const AIPlatformSettings: React.FC = () => {
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useAISettings();
  const { hasOpenAIAccess, hasAnthropicAccess, hasElevenLabsAccess } = useOrganizationFeatures();
  const [isLoading, setIsLoading] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    experience_sensitivity: settings?.experience_sensitivity || 0.5,
    industry_focus: settings?.industry_focus || 'general',
    bias_reduction_level: settings?.bias_reduction_level || 0.8,
    explainability_level: settings?.explainability_level || 'medium',
    data_sharing_level: settings?.data_sharing_level || 'internal',
    ai_processing_enabled: settings?.ai_processing_enabled ?? true,
    sensitive_data_processing: settings?.sensitive_data_processing ?? false,
    data_retention_days: settings?.data_retention_days || 365,
    audit_enabled: settings?.audit_enabled ?? true,
  });

  React.useEffect(() => {
    if (settings) {
      setLocalSettings({
        experience_sensitivity: settings.experience_sensitivity || 0.5,
        industry_focus: settings.industry_focus || 'general',
        bias_reduction_level: settings.bias_reduction_level || 0.8,
        explainability_level: settings.explainability_level || 'medium',
        data_sharing_level: settings.data_sharing_level || 'internal',
        ai_processing_enabled: settings.ai_processing_enabled ?? true,
        sensitive_data_processing: settings.sensitive_data_processing ?? false,
        data_retention_days: settings.data_retention_days || 365,
        audit_enabled: settings.audit_enabled ?? true,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateSettings(localSettings);
      toast({
        title: "Settings Saved",
        description: "AI platform settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI platform settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocalSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Platform Settings</h2>
          <p className="text-muted-foreground">Configure AI behavior and data handling preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Access Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Platform Access
          </CardTitle>
          <CardDescription>
            Current AI platform integrations available to your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={hasOpenAIAccess() ? "default" : "secondary"}>
              {hasOpenAIAccess() ? "✓" : "✗"} OpenAI Access
            </Badge>
            <Badge variant={hasAnthropicAccess() ? "default" : "secondary"}>
              {hasAnthropicAccess() ? "✓" : "✗"} Anthropic Access
            </Badge>
            <Badge variant={hasElevenLabsAccess() ? "default" : "secondary"}>
              {hasElevenLabsAccess() ? "✓" : "✗"} ElevenLabs Access
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="behavior" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Behavior Configuration
              </CardTitle>
              <CardDescription>
                Configure how AI models behave and respond in your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Experience Sensitivity: {localSettings.experience_sensitivity}</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.experience_sensitivity}
                  onChange={(e) => updateLocalSetting('experience_sensitivity', parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Controls how sensitive the AI is to user experience levels (0 = beginner-focused, 1 = expert-focused)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry-focus">Industry Focus</Label>
                <Select 
                  value={localSettings.industry_focus} 
                  onValueChange={(value) => updateLocalSetting('industry_focus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="trucking">Trucking</SelectItem>
                    <SelectItem value="recruitment">Recruitment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bias Reduction Level: {localSettings.bias_reduction_level}</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.bias_reduction_level}
                  onChange={(e) => updateLocalSetting('bias_reduction_level', parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Higher values apply stronger bias reduction techniques
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explainability">Explainability Level</Label>
                <Select 
                  value={localSettings.explainability_level} 
                  onValueChange={(value) => updateLocalSetting('explainability_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Faster responses</SelectItem>
                    <SelectItem value="medium">Medium - Balanced</SelectItem>
                    <SelectItem value="high">High - Detailed explanations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Data Handling
              </CardTitle>
              <CardDescription>
                Control how your data is processed and shared with AI services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Processing Enabled</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI processing of application data
                  </p>
                </div>
                <Switch
                  checked={localSettings.ai_processing_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('ai_processing_enabled', checked)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sensitive Data Processing</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow processing of sensitive personal information
                  </p>
                </div>
                <Switch
                  checked={localSettings.sensitive_data_processing}
                  onCheckedChange={(checked) => updateLocalSetting('sensitive_data_processing', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-sharing">Data Sharing Level</Label>
                <Select 
                  value={localSettings.data_sharing_level} 
                  onValueChange={(value) => updateLocalSetting('data_sharing_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - No data sharing</SelectItem>
                    <SelectItem value="internal">Internal - Organization only</SelectItem>
                    <SelectItem value="anonymized">Anonymized - Remove PII</SelectItem>
                    <SelectItem value="full">Full - Complete data (use cautiously)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention (Days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="3650"
                  value={localSettings.data_retention_days}
                  onChange={(e) => updateLocalSetting('data_retention_days', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  How long to retain AI analysis data (1-3650 days)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics & Monitoring
              </CardTitle>
              <CardDescription>
                Configure AI performance monitoring and audit trails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging of AI interactions and decisions
                  </p>
                </div>
                <Switch
                  checked={localSettings.audit_enabled}
                  onCheckedChange={(checked) => updateLocalSetting('audit_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced settings for AI platform integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Current Configuration Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Experience Sensitivity: {localSettings.experience_sensitivity}</div>
                  <div>Industry Focus: {localSettings.industry_focus}</div>
                  <div>Bias Reduction: {localSettings.bias_reduction_level}</div>
                  <div>Explainability: {localSettings.explainability_level}</div>
                  <div>Data Sharing: {localSettings.data_sharing_level}</div>
                  <div>Retention: {localSettings.data_retention_days} days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIPlatformSettings;