import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Briefcase, Users, TrendingUp, MapPin } from 'lucide-react';
import type { ClientMetrics } from '../hooks/useClientMetrics';

interface ClientMetricsCardProps {
  client: ClientMetrics;
}

export const ClientMetricsCard: React.FC<ClientMetricsCardProps> = ({ client }) => {
  const location = [client.city, client.state].filter(Boolean).join(', ');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {client.logo_url ? (
              <img 
                src={client.logo_url} 
                alt={client.name}
                className="w-10 h-10 rounded-lg object-contain bg-muted"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-base font-semibold">{client.name}</CardTitle>
              {location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {location}
                </div>
              )}
            </div>
          </div>
          <Badge 
            variant={client.status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {client.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="text-xs">Jobs</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{client.jobCount}</span>
              <span className="text-xs text-muted-foreground">
                ({client.activeJobCount} active)
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">Applications</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{client.applicationCount}</span>
              {client.recentApplications > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  +{client.recentApplications} (30d)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Avg. per job
            </span>
            <span className="font-medium">{client.avgApplicationsPerJob} apps</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientMetricsCard;
