import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle, Shield, Eye, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { aiService } from '@/services/aiService';

interface TruthContractConfig {
  enableFactChecking: boolean;
  enableBiasDetection: boolean;
  enableCompletenessValidation: boolean;
  enableSourceAttribution: boolean;
  minimumTruthScore: number;
  maxRetries: number;
  fallbackToHuman: boolean;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
}

const TruthContractMonitor: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TruthContractConfig | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [configData, healthData] = await Promise.all([
        aiService.getTruthContractConfig(),
        aiService.getTruthContractHealth()
      ]);
      
      setConfig(configData);
      setHealth(healthData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load Truth Contract data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig: Partial<TruthContractConfig>) => {
    if (!config) return;

    try {
      setIsUpdating(true);
      const updatedConfig = { ...config, ...newConfig };
      await aiService.updateTruthContractConfig(updatedConfig);
      setConfig(updatedConfig);
      
      toast({
        title: "Configuration Updated",
        description: "Truth Contract settings have been updated successfully"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update Truth Contract configuration",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const refreshHealth = async () => {
    try {
      const healthData = await aiService.getTruthContractHealth();
      setHealth(healthData);
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: "Unable to refresh health status",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Truth Contract Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getHealthIcon = () => {
    if (!health) return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    
    switch (health.status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getHealthBadgeVariant = () => {
    if (!health) return 'secondary';
    
    switch (health.status) {
      case 'healthy':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Truth Contract Status
          </CardTitle>
          <CardDescription>
            Real-time monitoring of AI truthfulness validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {getHealthIcon()}
              <Badge variant={getHealthBadgeVariant()}>
                {health?.status || 'Unknown'}
              </Badge>
            </div>
            <Button onClick={refreshHealth} variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          {health?.details && (
            <div className="space-y-2 text-sm text-muted-foreground">
              {health.details.lastScore && (
                <div className="flex justify-between">
                  <span>Last Validation Score:</span>
                  <span className="font-medium">{health.details.lastScore}%</span>
                </div>
              )}
              {health.details.validationWorking !== undefined && (
                <div className="flex justify-between">
                  <span>Validation System:</span>
                  <Badge variant={health.details.validationWorking ? 'default' : 'destructive'}>
                    {health.details.validationWorking ? 'Working' : 'Offline'}
                  </Badge>
                </div>
              )}
              {health.details.error && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{health.details.error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Truth Contract Configuration
            </CardTitle>
            <CardDescription>
              Configure validation parameters and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Validation Features */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Validation Features</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="fact-checking" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Fact Checking
                </Label>
                <Switch
                  id="fact-checking"
                  checked={config.enableFactChecking}
                  onCheckedChange={(checked) => updateConfig({ enableFactChecking: checked })}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bias-detection" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Bias Detection
                </Label>
                <Switch
                  id="bias-detection"
                  checked={config.enableBiasDetection}
                  onCheckedChange={(checked) => updateConfig({ enableBiasDetection: checked })}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="completeness-validation">
                  Completeness Validation
                </Label>
                <Switch
                  id="completeness-validation"
                  checked={config.enableCompletenessValidation}
                  onCheckedChange={(checked) => updateConfig({ enableCompletenessValidation: checked })}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="source-attribution">
                  Source Attribution
                </Label>
                <Switch
                  id="source-attribution"
                  checked={config.enableSourceAttribution}
                  onCheckedChange={(checked) => updateConfig({ enableSourceAttribution: checked })}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <Separator />

            {/* Thresholds */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Quality Thresholds</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Minimum Truth Score</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.minimumTruthScore}%
                  </span>
                </div>
                <Slider
                  value={[config.minimumTruthScore]}
                  onValueChange={([value]) => updateConfig({ minimumTruthScore: value })}
                  max={100}
                  min={0}
                  step={5}
                  disabled={isUpdating}
                />
                <Progress value={config.minimumTruthScore} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Maximum Retries</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.maxRetries}
                  </span>
                </div>
                <Slider
                  value={[config.maxRetries]}
                  onValueChange={([value]) => updateConfig({ maxRetries: value })}
                  max={10}
                  min={1}
                  step={1}
                  disabled={isUpdating}
                />
              </div>
            </div>

            <Separator />

            {/* Fallback Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Fallback Options</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="fallback-human">
                  Fallback to Human Review
                </Label>
                <Switch
                  id="fallback-human"
                  checked={config.fallbackToHuman}
                  onCheckedChange={(checked) => updateConfig({ fallbackToHuman: checked })}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Truth Contract Principles</CardTitle>
          <CardDescription>
            Core principles governing AI response validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Factual Accuracy:</strong> All claims must be verifiable or clearly marked as uncertain
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Completeness:</strong> Responses must thoroughly address all aspects of the request
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Bias Mitigation:</strong> Content is analyzed for prejudicial language and assumptions
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Source Attribution:</strong> Credible sources are provided for factual claims
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <strong>Ethical Compliance:</strong> Content promotes beneficial and non-harmful outcomes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TruthContractMonitor;