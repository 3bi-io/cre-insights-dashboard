import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIConnectionManager } from '@/hooks/useAIConnectionManager';
import { RefreshCw, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

const AIConnectionStatusPanel: React.FC = () => {
  const {
    connectionStatuses,
    isRefreshing,
    isMonitoring,
    refreshAllConnections,
    startMonitoring,
    stopMonitoring,
    getHealthSummary,
  } = useAIConnectionManager();

  const health = getHealthSummary();

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (isConnected: boolean) => {
    return (
      <Badge variant={isConnected ? "default" : "destructive"}>
        {isConnected ? "Connected" : "Disconnected"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              AI Platform Connections
            </CardTitle>
            <CardDescription>
              Monitor and manage AI service connections across platforms
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAllConnections}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
            <Button
              variant={isMonitoring ? "secondary" : "outline"}
              size="sm"
              onClick={isMonitoring ? stopMonitoring : () => startMonitoring()}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{health.connectedProviders}</div>
            <div className="text-sm text-muted-foreground">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{health.totalProviders}</div>
            <div className="text-sm text-muted-foreground">Total Providers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{health.healthPercentage.toFixed(0)}%</div>
            <div className="text-sm text-muted-foreground">Health Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{health.avgLatency.toFixed(0)}ms</div>
            <div className="text-sm text-muted-foreground">Avg Latency</div>
          </div>
        </div>

        {/* Provider Status List */}
        <div className="space-y-3">
          {connectionStatuses.map((status) => (
            <div
              key={status.provider}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(status.isConnected)}
                <div>
                  <div className="font-medium capitalize">{status.provider}</div>
                  <div className="text-sm text-muted-foreground">
                    {status.model || 'Unknown model'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {status.latency && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {status.latency}ms
                  </div>
                )}
                {getStatusBadge(status.isConnected)}
              </div>
            </div>
          ))}
        </div>

        {connectionStatuses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No connection data available</p>
            <p className="text-sm">Click "Refresh All" to check connections</p>
          </div>
        )}

        {/* Status Footer */}
        <div className="text-sm text-muted-foreground text-center pt-2 border-t">
          {connectionStatuses.length > 0 && (
            <>
              Last checked: {connectionStatuses[0]?.lastChecked.toLocaleTimeString()}
              {isMonitoring && " • Auto-monitoring enabled"}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIConnectionStatusPanel;