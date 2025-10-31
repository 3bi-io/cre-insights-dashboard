/**
 * Developer Tools Panel
 * Provides a debug overlay for development with performance metrics, error logs, and utilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  Cpu, 
  Database, 
  Network, 
  Settings, 
  X,
  RefreshCw,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { devTools } from '@/utils/devTools';
import { logger } from '@/lib/logger';

interface DevToolsPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const DevToolsPanel: React.FC<DevToolsPanelProps> = ({
  isVisible,
  onToggle
}) => {
  const [config, setConfig] = useState(devTools.getConfig());
  const [logs, setLogs] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    memoryUsage: null as any,
    bundleAnalysis: null as any,
    slowComponents: [] as string[]
  });

  useEffect(() => {
    // Subscribe to log updates (if logger supports it)
    const updateMetrics = () => {
      const memoryUsage = (window as any).devTools?.performance.getMemoryUsage();
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage
      }));
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConfigChange = (key: keyof typeof config, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    devTools.updateConfig(newConfig);
  };

  const runBundleAnalysis = () => {
    const analysis = (window as any).devTools?.inspect.analyzeBundle();
    setPerformanceMetrics(prev => ({
      ...prev,
      bundleAnalysis: analysis
    }));
  };

  const checkAccessibility = () => {
    (window as any).devTools?.inspect.checkAccessibility();
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 w-96 h-[600px] bg-background border-2 border-primary shadow-2xl rounded-lg z-[9999] overflow-hidden">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Dev Tools
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full">
          <Tabs defaultValue="performance" className="h-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none">
              <TabsTrigger value="performance" className="text-xs">
                <Cpu className="w-3 h-3 mr-1" />
                Perf
              </TabsTrigger>
              <TabsTrigger value="logs" className="text-xs">
                <Database className="w-3 h-3 mr-1" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="network" className="text-xs">
                <Network className="w-3 h-3 mr-1" />
                Net
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Config
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="m-0 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Performance Metrics</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runBundleAnalysis}
                  className="h-6"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Analyze
                </Button>
              </div>

              {/* Memory Usage */}
              {performanceMetrics.memoryUsage && (
                <div className="space-y-1">
                  <div className="text-xs font-medium">Memory Usage</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      Used: {Math.round(performanceMetrics.memoryUsage.usedJSHeapSize / 1024 / 1024)}MB
                    </div>
                    <div>
                      Limit: {Math.round(performanceMetrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024)}MB
                    </div>
                  </div>
                </div>
              )}

              {/* Bundle Analysis */}
              {performanceMetrics.bundleAnalysis && (
                <div className="space-y-1">
                  <div className="text-xs font-medium">Bundle Analysis</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div>JS Files: {performanceMetrics.bundleAnalysis.jsFiles}</div>
                    <div>CSS Files: {performanceMetrics.bundleAnalysis.cssFiles}</div>
                    <div>Images: {performanceMetrics.bundleAnalysis.images}</div>
                    <div>Total: {performanceMetrics.bundleAnalysis.totalResources}</div>
                  </div>
                  
                  {performanceMetrics.bundleAnalysis.largeResources.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {performanceMetrics.bundleAnalysis.largeResources.length} large resources
                    </Badge>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={checkAccessibility}
                  className="w-full h-7 text-xs"
                >
                  Check Accessibility
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="m-0 p-0">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Console Logs</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearLogs}
                    className="h-6"
                  >
                    Clear
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8">
                      No logs recorded yet
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="border rounded p-2 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          {log.level === 'error' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          {log.level === 'warn' && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                          {log.level === 'info' && <Info className="w-3 h-3 text-blue-500" />}
                          <Badge variant="outline" className="text-xs">
                            {log.level}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-medium">{log.message}</div>
                        {log.data && (
                          <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="network" className="m-0 p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Network Monitoring</h4>
                <div className="text-xs text-muted-foreground">
                  Network requests will be logged to the console when enabled in settings.
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    // Trigger a test API call for demonstration
                    logger.info('Test API call', { method: 'GET', url: '/api/test' });
                  }}
                  className="w-full h-7"
                >
                  Test API Call Logging
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="m-0 p-4">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Configuration</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Performance Metrics</label>
                    <Switch
                      checked={config.showPerformanceMetrics}
                      onCheckedChange={(value) => handleConfigChange('showPerformanceMetrics', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Verbose Logging</label>
                    <Switch
                      checked={config.enableVerboseLogging}
                      onCheckedChange={(value) => handleConfigChange('enableVerboseLogging', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Network Requests</label>
                    <Switch
                      checked={config.showNetworkRequests}
                      onCheckedChange={(value) => handleConfigChange('showNetworkRequests', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium">Error Boundary</label>
                    <Switch
                      checked={config.showErrorBoundary}
                      onCheckedChange={(value) => handleConfigChange('showErrorBoundary', value)}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Dev Tools Version: 1.0.0<br />
                    Environment: {import.meta.env.MODE}<br />
                    React Version: {React.version}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Dev Tools Toggle Button - appears in development mode
 */
export const DevToolsToggle: React.FC<{ onToggle: () => void }> = ({ onToggle }) => {
  if (!import.meta.env.DEV) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="fixed bottom-4 right-4 h-10 w-10 p-0 rounded-full bg-primary text-primary-foreground shadow-lg z-[9998]"
      title="Toggle Dev Tools"
    >
      <Zap className="w-4 h-4" />
    </Button>
  );
};