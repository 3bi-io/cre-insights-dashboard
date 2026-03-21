import React, { useState } from 'react';
import { PageLayout } from '@/features/shared';
import { useClientPortalData } from '@/hooks/useClientPortalData';
import { useClientPortalAnalytics } from '@/hooks/useClientPortalAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, RefreshCw } from 'lucide-react';
import type { DateRange } from '@/features/clients/types/clientAnalytics.types';
import { ClientAnalyticsDateFilter } from '@/features/clients/components/analytics';
import { KPIHeroCards } from './client-portal/KPIHeroCards';
import { PipelineFunnel } from './client-portal/PipelineFunnel';
import { AnalyticsChartsRow } from './client-portal/AnalyticsChartsRow';
import { ATSDeliverySection } from './client-portal/ATSDeliverySection';
import { RecentApplicantsTable } from './client-portal/RecentApplicantsTable';
import { JobPerformanceSection } from './client-portal/JobPerformanceSection';

interface ClientPortalDashboardProps {
  overrideClientId?: string;
}

export const ClientPortalDashboard: React.FC<ClientPortalDashboardProps> = ({ overrideClientId }) => {
  const { data: assignedClients, isLoading: clientsLoading, error: clientsError } = useClientPortalData();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const activeClientId = overrideClientId || selectedClientId || assignedClients?.[0]?.id || null;
  const activeClient = overrideClientId
    ? { id: overrideClientId, name: '', logo_url: null, city: null, state: null, status: 'active' }
    : assignedClients?.find(c => c.id === activeClientId);
  const hasMultipleClients = !overrideClientId && (assignedClients?.length || 0) > 1;

  const { data: analytics, isLoading: analyticsLoading, refetch } = useClientPortalAnalytics(activeClientId, dateRange);

  // Build sparkline data from trends
  const sparklineData = analytics?.trends?.slice(-14).map(t => ({ date: t.date, count: t.applications })) || [];

  if (!overrideClientId && clientsLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!overrideClientId && (clientsError || !assignedClients?.length)) {
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

  const Wrapper = overrideClientId ? React.Fragment : PageLayout;

  return (
    <Wrapper>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {activeClient?.logo_url && (
              <img
                src={activeClient.logo_url}
                alt={activeClient.name}
                className="h-14 w-14 rounded-xl object-contain border border-border bg-card p-1"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-foreground">{activeClient?.name || 'Client Dashboard'}</h1>
              {activeClient?.city && activeClient?.state && (
                <p className="text-sm text-muted-foreground">{activeClient.city}, {activeClient.state}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasMultipleClients && (
              <Select value={activeClientId || ''} onValueChange={val => setSelectedClientId(val)}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {assignedClients!.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
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

        {/* Section 1: KPI Hero Cards */}
        <KPIHeroCards analytics={analytics || null} isLoading={analyticsLoading} sparklineData={sparklineData} />

        {/* Section 2: Pipeline Funnel */}
        {analytics && (
          <PipelineFunnel data={analytics.pipeline} totalApplications={analytics.totalApplications} />
        )}

        {/* Section 3: Charts Row */}
        {analytics && (
          <AnalyticsChartsRow
            trends={analytics.trends}
            sources={analytics.sources}
            totalApplications={analytics.totalApplications}
          />
        )}

        {/* Section 4: ATS Delivery */}
        {analytics && <ATSDeliverySection data={analytics.atsDelivery} />}

        {/* Section 5: Recent Applicants */}
        {activeClientId && (
          <RecentApplicantsTable clientId={activeClientId} dateRange={dateRange} />
        )}

        {/* Section 6: Job Performance */}
        {activeClientId && (
          <JobPerformanceSection clientId={activeClientId} dateRange={dateRange} />
        )}

        {/* Empty state when no data at all */}
        {!analyticsLoading && !analytics && activeClientId && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium text-foreground">No analytics data available yet</p>
              <p className="text-sm text-muted-foreground mt-1">Data will appear as applications come in for this client.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Wrapper>
  );
};
