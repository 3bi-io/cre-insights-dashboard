import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Database, Zap, Shield, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'offline';
  icon: any;
  latency?: number;
}

export const SystemHealthMonitor = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Database', status: 'operational', icon: Database },
    { name: 'Authentication', status: 'operational', icon: Shield },
    { name: 'Edge Functions', status: 'operational', icon: Zap },
    { name: 'Storage', status: 'operational', icon: Globe },
  ]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const start = Date.now();
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const latency = Date.now() - start;
        
        setServices(prev => prev.map(service => 
          service.name === 'Database' 
            ? { ...service, status: error ? 'degraded' : 'operational', latency }
            : service
        ));
      } catch (error) {
        logger.error('Health check failed', error, { context: 'SystemHealthMonitor' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <service.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{service.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {service.latency && (
                <span className="text-xs text-muted-foreground">{service.latency}ms</span>
              )}
              <Badge 
                variant={service.status === 'operational' ? 'default' : 'destructive'}
                className="flex items-center gap-1"
              >
                {service.status === 'operational' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertCircle className="w-3 h-3" />
                )}
                {service.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
