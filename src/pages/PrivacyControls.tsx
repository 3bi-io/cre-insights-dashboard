import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  Brain, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Info,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';
import { useAISettings, AISettings } from '@/hooks/useAISettings';
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

const PrivacyControls = () => {
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

  if (loading || !settings) {
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
            <Badge className={getDataLevelColor(settings.data_sharing_level)}>
              {settings.data_sharing_level.toUpperCase()} Protection
            </Badge>
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
            <CardDescription>
              Configure how AI models analyze your data
            </CardDescription>
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
                  <p className="text-sm text-muted-foreground">
                    Enable AI analysis of application data
                  </p>
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
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Experience Sensitivity</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">How heavily to weigh experience in candidate evaluation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Bias Reduction Level</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Controls how aggressively the system reduces bias in AI decisions</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
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
                  <p className="text-sm text-muted-foreground">
                    Allow AI to process sensitive candidate information
                  </p>
                </div>
                <Switch
                  checked={settings.sensitive_data_processing}
                  onCheckedChange={(checked) => updateSettings({ sensitive_data_processing: checked })}
                  disabled={!settings.ai_processing_enabled || settings.data_sharing_level === 'restricted'}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Explainability Level</label>
                <Select 
                  value={settings.explainability_level} 
                  onValueChange={(value) => updateSettings({ explainability_level: value })}
                  disabled={!settings.ai_processing_enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (Minimal Explanation)</SelectItem>
                    <SelectItem value="medium">Medium (Standard Detail)</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive (Full Detail)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Determines how detailed AI explanations will be for decisions
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Industry Focus</label>
                <Select 
                  value={settings.industry_focus} 
                  onValueChange={(value) => updateSettings({ industry_focus: value })}
                  disabled={!settings.ai_processing_enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="transportation">Transportation & Logistics</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Optimizes AI analysis for specific industry needs
                </p>
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
            <CardDescription>
              Control how long AI analysis data is stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Data Retention Period (Days)</label>
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
                <p className="text-xs text-muted-foreground mt-1">
                  How long AI analysis results are stored before automatic deletion
                </p>
              </div>
              
              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Enable Audit Logging</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Tracks all AI interactions for compliance and review</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Log all AI decisions and data access events
                  </p>
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
              onClick={() => {
                toast.success("Data export request submitted");
              }}
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
              
              <div className="flex justify-between">
                <span className="text-sm">Cache Status:</span>
                <Badge variant="outline">Enabled (24h TTL)</Badge>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm">Background Processing:</span>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Currently Active Providers:</h4>
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

export default PrivacyControls;