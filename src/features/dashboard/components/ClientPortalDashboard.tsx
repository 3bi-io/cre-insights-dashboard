import React, { useState } from 'react';
import { PageLayout } from '@/features/shared';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { useClientPortalAnalytics } from '@/hooks/useClientPortalAnalytics';
import {
  ClientAnalyticsDateFilter,
  ClientPipelineFunnel,
  ClientSourceBreakdown,
  ClientATSDeliveryStatus,
  ClientSLAMetrics,
  ClientTrendChart,
} from '@/features/clients/components/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Briefcase, Gauge, Clock, Building2, RefreshCw } from 'lucide-react';
import type { DateRange } from '@/features/clients/types/clientAnalytics.types';

interface ClientPortalDashboardProps {
  overrideClientId?: string;
}

export const ClientPortalDashboard: React.FC<ClientPortalDashboardProps> = ({ overrideClientId }) => {
  const { data: assignedClients, isLoading: clientsLoading, error: clientsError } = useClientPortalData();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Auto-select first client when loaded
  // If overrideClientId is set (admin preview mode), use it directly
  const activeClientId = overrideClientId || selectedClientId || assignedClients?.[0]?.id || null;
  const activeClient = overrideClientId 
    ? { id: overrideClientId, name: '', logo_url: null, city: null, state: null, status: 'active' }
    : assignedClients?.find(c => c.id === activeClientId);
  const hasMultipleClients = !overrideClientId && (assignedClients?.length || 0) > 1;
  const hasMultipleClients = (assignedClients?.length || 0) > 1;

  // Pass null for organization since client-role users access via RLS directly
  const { data: analytics, isLoading: analyticsLoading, refetch } = useClientPortalAnalytics(activeClientId, dateRange);

  if (clientsLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (clientsError || !assignedClients?.length) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">No Clients Assigned</h1>
          <p className="text-muted-foreground">
            Contact your organization admin to get access to client data.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {activeClient?.logo_url && (
              <img
                src={activeClient.logo_url}
                alt={activeClient.name}
                className="h-12 w-12 rounded-lg object-contain border bg-background"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{activeClient?.name || 'Client Dashboard'}</h1>
              {activeClient?.city && activeClient?.state && (
                <p className="text-sm text-muted-foreground">{activeClient.city}, {activeClient.state}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasMultipleClients && (
              <Select
                value={activeClientId || ''}
                onValueChange={(val) => setSelectedClientId(val)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {assignedClients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <ClientAnalyticsDateFilter value={dateRange} onChange={setDateRange} />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={analyticsLoading}>
              <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        {analyticsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-20" /></CardContent></Card>
            ))}
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Applications</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalApplications.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ATS Delivery</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.atsDelivery.successRate}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Readiness</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.avgReadinessScore}/100</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.sla.avgResponseHours > 0 ? `${analytics.sla.avgResponseHours}h` : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Analytics Panels */}
        {analytics && (
          <div className="space-y-4">
            <ClientPipelineFunnel data={analytics.pipeline} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ClientSourceBreakdown data={analytics.sources} />
              <ClientATSDeliveryStatus data={analytics.atsDelivery} />
            </div>
            <ClientSLAMetrics data={analytics.sla} />
            <ClientTrendChart data={analytics.trends} />
          </div>
        )}

        {!analyticsLoading && !analytics && activeClientId && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No analytics data available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};
