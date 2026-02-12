import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, RefreshCw, Building2, GitCompare } from 'lucide-react';
import { useClientPortfolioAnalytics } from '../hooks/useClientPortfolioAnalytics';
import { useClientAnalytics } from '../hooks/useClientAnalytics';
import {
  ClientAnalyticsDateFilter,
  ClientAnalyticsSummary,
  ClientLeaderboard,
  ClientPipelineFunnel,
  ClientSourceBreakdown,
  ClientATSDeliveryStatus,
  ClientSLAMetrics,
  ClientTrendChart,
  ClientComparison,
} from './analytics';
import type { DateRange } from '../types/clientAnalytics.types';

const ClientAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  const { clients, summary, isLoading, error, refetch } = useClientPortfolioAnalytics(dateRange);
  const { data: clientDetail, isLoading: detailLoading } = useClientAnalytics(selectedClientId, dateRange);

  const filteredClients = search
    ? clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase()) ||
        c.state?.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  const handleSelectClient = useCallback((clientId: string) => {
    if (showComparison) {
      setCompareIds(prev => {
        if (prev.includes(clientId)) return prev.filter(id => id !== clientId);
        if (prev.length >= 3) return prev;
        return [...prev, clientId];
      });
    } else {
      setSelectedClientId(clientId);
    }
  }, [showComparison]);

  const toggleComparison = () => {
    setShowComparison(prev => !prev);
    if (showComparison) setCompareIds([]);
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6 text-center">
          <p className="text-destructive">Failed to load analytics: {error.message}</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <ClientAnalyticsSummary summary={summary} isLoading={isLoading} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showComparison ? 'default' : 'outline'}
            size="sm"
            onClick={toggleComparison}
            className="gap-2"
          >
            <GitCompare className="w-4 h-4" />
            Compare
            {compareIds.length > 0 && ` (${compareIds.length})`}
          </Button>
          <ClientAnalyticsDateFilter value={dateRange} onChange={setDateRange} />
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && (
        <ClientComparison
          clients={clients}
          selectedIds={compareIds}
          onToggleClient={(id) => setCompareIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
          )}
        />
      )}

      {/* Leaderboard */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </CardContent>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No clients found</h3>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search.' : 'Add clients to see analytics.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ClientLeaderboard
          clients={filteredClients}
          isLoading={isLoading}
          onSelectClient={handleSelectClient}
        />
      )}

      {/* Client Detail Drawer */}
      <Sheet open={!!selectedClientId} onOpenChange={(open) => !open && setSelectedClientId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{clientDetail?.clientName || 'Client Analytics'}</SheetTitle>
          </SheetHeader>
          {detailLoading ? (
            <div className="space-y-4 mt-6">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
            </div>
          ) : clientDetail ? (
            <div className="space-y-4 mt-6">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{clientDetail.totalApplications}</div>
                    <div className="text-xs text-muted-foreground">Applications</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{clientDetail.avgReadinessScore}/100</div>
                    <div className="text-xs text-muted-foreground">Avg Readiness</div>
                  </CardContent>
                </Card>
              </div>

              <ClientPipelineFunnel data={clientDetail.pipeline} />
              <div className="grid grid-cols-1 gap-4">
                <ClientSourceBreakdown data={clientDetail.sources} />
                <ClientATSDeliveryStatus data={clientDetail.atsDelivery} />
              </div>
              <ClientSLAMetrics data={clientDetail.sla} />
              <ClientTrendChart data={clientDetail.trends} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-6">No data available for this client.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ClientAnalyticsDashboard;
