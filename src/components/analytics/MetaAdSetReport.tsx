import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  DollarSign, 
  Users, 
  Target, 
  TrendingUp, 
  Eye, 
  MousePointer,
  AlertCircle,
  Download,
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useMetaAdSetReport } from '@/hooks/useMetaAdSetReport';
import { useToast } from '@/hooks/use-toast';

const MetaAdSetReport = () => {
  const [dateRange, setDateRange] = useState('last_30d');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data, isLoading, error, refetch } = useMetaAdSetReport(dateRange);
  const { toast } = useToast();

  // Debug logging (no-op in production)
  React.useEffect(() => {
    logger.debug('MetaAdSetReport data updated', { 
      dataCount: data?.adSets?.length, 
      isLoading, 
      hasError: !!error, 
      context: 'MetaAdSetReport' 
    });
  }, [data, isLoading, error]);

  const handleExportCSV = () => {
    if (!data?.adSets?.length) {
      toast({
        title: "No Data Available",
        description: "There's no data to export at the moment.",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Ad Set Name',
      'Campaign Name', 
      'Status',
      'Total Spend',
      'Total Leads',
      'Cost Per Lead',
      'Impressions',
      'Clicks',
      'CTR (%)',
      'CPM',
      'CPC',
      'Reach',
      'Frequency'
    ];

    const rows = data.adSets.map(adSet => [
      adSet.adSetName,
      adSet.campaignName,
      adSet.status,
      `$${adSet.totalSpend.toFixed(2)}`,
      adSet.totalLeads.toString(),
      adSet.costPerLead > 0 ? `$${adSet.costPerLead.toFixed(2)}` : '$0.00',
      adSet.impressions.toLocaleString(),
      adSet.clicks.toLocaleString(),
      `${adSet.ctr.toFixed(2)}%`,
      `$${adSet.cpm.toFixed(2)}`,
      `$${adSet.cpc.toFixed(2)}`,
      adSet.reach.toLocaleString(),
      adSet.frequency.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meta-adset-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Ad Set report has been exported successfully.",
    });
  };

  const filteredAdSets = data?.adSets?.filter(adSet => {
    if (statusFilter === 'all') return true;
    return adSet.status.toLowerCase() === statusFilter.toLowerCase();
  }) || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading Meta Ad Set report: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.adSets?.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No Meta Ad Set data available for the selected period. Please sync your Meta data first.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meta Ad Set Performance Report</h2>
          <p className="text-muted-foreground">
            Detailed spend and lead analysis by Ad Set for {data.summary?.dateRange.start} to {data.summary?.dateRange.end}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="last_7d">Last 7 Days</option>
            <option value="last_14d">Last 14 Days</option>
            <option value="last_30d">Last 30 Days</option>
            <option value="last_60d">Last 60 Days</option>
            <option value="last_90d">Last 90 Days</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
          <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={refetch} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.summary.totalSpend.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across {data.summary.totalAdSets} Ad Sets
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalLeads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                From Meta campaigns
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cost Per Lead</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${data.summary.averageCostPerLead > 0 ? data.summary.averageCostPerLead.toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Average across all Ad Sets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {data.summary.totalClicks.toLocaleString()} clicks
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ad Sets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Ad Set Performance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Set Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Cost/Lead</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>CPM</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>Reach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdSets.map((adSet, index) => (
                  <TableRow key={`${adSet.adSetId}-${index}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="truncate max-w-48" title={adSet.adSetName}>
                          {adSet.adSetName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {adSet.adSetId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate max-w-32" title={adSet.campaignName}>
                        {adSet.campaignName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(adSet.status)}>
                        {adSet.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${adSet.totalSpend.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {adSet.totalLeads}
                    </TableCell>
                    <TableCell className="font-mono">
                      {adSet.costPerLead > 0 ? `$${adSet.costPerLead.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {adSet.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {adSet.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {adSet.ctr.toFixed(2)}%
                    </TableCell>
                    <TableCell className="font-mono">
                      ${adSet.cpm.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${adSet.cpc.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {adSet.reach.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaAdSetReport;