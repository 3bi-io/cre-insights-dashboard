import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Brain, 
  Info,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { useAISettings } from '@/hooks/useAISettings';
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
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

const PrivacyControlsContent = () => {
  const { settings, loading, updateSettings } = useAISettings();
  
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'internal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sensitive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'restricted':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Privacy Controls</h2>
            <p className="text-muted-foreground">Manage how your data is processed and shared with AI systems</p>
          </div>
          <Badge className={getDataLevelColor(settings.data_sharing_level)}>
            {settings.data_sharing_level.toUpperCase()} Protection
          </Badge>
        </div>

        {/* Data Protection Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data Protection Level
            </CardTitle>
            <CardDescription>Choose how your applicant data should be handled by AI systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select 
                value={settings.data_sharing_level}
                onValueChange={(value) => updateSettings({ data_sharing_level: value })}
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
                  {getDataLevelDescription(settings.data_sharing_level)}
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
              AI Analysis Parameters
            </CardTitle>
            <CardDescription>Configure how AI models analyze your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Enable AI Processing</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Enable AI-powered insights and recommendations for applications</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">Enable AI analysis of application data</p>
                </div>
                <Switch
                  checked={settings.ai_processing_enabled}
                  onCheckedChange={(checked) => updateSettings({ ai_processing_enabled: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Experience Sensitivity</label>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {settings.experience_sensitivity < 0.33 ? 'Low' : 
                    settings.experience_sensitivity < 0.66 ? 'Medium' : 'High'}
                  </span>
                </div>
                <Slider
                  value={[settings.experience_sensitivity]}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => updateSettings({ experience_sensitivity: value[0] })}
                  disabled={!settings.ai_processing_enabled}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Bias Reduction Level</label>
                  <span className="text-sm text-muted-foreground">
                    {settings.bias_reduction_level < 0.33 ? 'Low' : 
                    settings.bias_reduction_level < 0.66 ? 'Medium' : 'High'}
                  </span>
                </div>
                <Slider
                  value={[settings.bias_reduction_level]}
                  max={1}
                  step={0.01}
                  onValueChange={(value) => updateSettings({ bias_reduction_level: value[0] })}
                  disabled={!settings.ai_processing_enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Process Sensitive Data</label>
                  <p className="text-sm text-muted-foreground">Allow AI to process sensitive candidate information</p>
                </div>
                <Switch
                  checked={settings.sensitive_data_processing}
                  onCheckedChange={(checked) => updateSettings({ sensitive_data_processing: checked })}
                  disabled={!settings.ai_processing_enabled || settings.data_sharing_level === 'restricted'}
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
              Data Retention & Auditing
            </CardTitle>
            <CardDescription>Control how long AI analysis data is stored</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Data Retention Period</label>
                  <span className="text-sm font-medium">{settings.data_retention_days} days</span>
                </div>
                <Select 
                  value={settings.data_retention_days.toString()}
                  onValueChange={(value) => updateSettings({ data_retention_days: parseInt(value) })}
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
              
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Enable Audit Logging</label>
                  <p className="text-sm text-muted-foreground">Log all AI decisions and data access events</p>
                </div>
                <Switch
                  checked={settings.audit_enabled}
                  onCheckedChange={(checked) => updateSettings({ audit_enabled: checked })}
                />
              </div>
            </div>
          </CardContent>
          <CardContent className="border-t pt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => toast.success("Data export request submitted")}
            >
              Request Data Export
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              System Status
            </CardTitle>
            <CardDescription>Current AI system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">AI Processing:</span>
                <Badge variant={settings.ai_processing_enabled ? "default" : "secondary"}>
                  {settings.ai_processing_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Sensitive Data:</span>
                <Badge variant={settings.sensitive_data_processing ? "default" : "outline"}>
                  {settings.sensitive_data_processing ? 'Allowed' : 'Restricted'}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Provider Preference:</span>
                <Badge variant="outline">Anthropic → OpenAI → Basic</Badge>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Active Providers:</h4>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Anthropic
                </Badge>
                <Badge variant="secondary" className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  OpenAI
                </Badge>
                <Badge variant="secondary" className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Rule-Based
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default PrivacyControlsContent;
