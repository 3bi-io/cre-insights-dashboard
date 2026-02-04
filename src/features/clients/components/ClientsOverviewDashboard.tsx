import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { 
  Building2, 
  Briefcase, 
  Users, 
  TrendingUp, 
  Search,
  RefreshCw,
  ArrowUpDown,
  Grid3X3,
  List
} from 'lucide-react';
import { useClientMetrics, type ClientMetrics } from '../hooks/useClientMetrics';
import ClientMetricsCard from './ClientMetricsCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SortField = 'name' | 'jobCount' | 'applicationCount' | 'recentApplications';
type SortDirection = 'asc' | 'desc';

export const ClientsOverviewDashboard: React.FC = () => {
  const { clients, summary, isLoading, error, refetch } = useClientMetrics();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('applicationCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = clients.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.city?.toLowerCase().includes(searchLower) ||
        c.state?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'jobCount':
          comparison = a.jobCount - b.jobCount;
          break;
        case 'applicationCount':
          comparison = a.applicationCount - b.applicationCount;
          break;
        case 'recentApplications':
          comparison = a.recentApplications - b.recentApplications;
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [clients, search, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            Failed to load client metrics: {error.message}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="mx-auto mt-4 block">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Clients"
          value={summary.totalClients}
          subtitle={`${summary.activeClients} active`}
          icon={Building2}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Jobs"
          value={summary.totalJobs}
          icon={Briefcase}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Applications"
          value={summary.totalApplications}
          icon={Users}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Avg. Apps/Client"
          value={summary.avgApplicationsPerClient}
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Active Rate"
          value={summary.totalClients > 0 
            ? `${Math.round((summary.activeClients / summary.totalClients) * 100)}%`
            : '0%'
          }
          icon={TrendingUp}
          isLoading={isLoading}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Client List */}
      {isLoading ? (
        <LoadingSkeleton viewMode={viewMode} />
      ) : filteredAndSortedClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">No clients found</h3>
            <p className="text-muted-foreground">
              {search ? 'Try adjusting your search criteria.' : 'Add clients to see metrics here.'}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedClients.map(client => (
            <ClientMetricsCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                    Client
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('jobCount')}>
                    Jobs
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('applicationCount')}>
                    Applications
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('recentApplications')}>
                    Recent (30d)
                    <ArrowUpDown className="w-3 h-3 ml-1" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Avg/Job</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.map(client => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LogoAvatar size="sm" className="w-8 h-8">
                        {client.logo_url ? (
                          <LogoAvatarImage src={client.logo_url} alt={client.name} />
                        ) : (
                          <LogoAvatarFallback iconSize="sm" />
                        )}
                      </LogoAvatar>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        {(client.city || client.state) && (
                          <div className="text-xs text-muted-foreground">
                            {[client.city, client.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={client.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium">{client.jobCount}</span>
                    <span className="text-muted-foreground text-xs ml-1">
                      ({client.activeJobCount} active)
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {client.applicationCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {client.recentApplications > 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        +{client.recentApplications}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {client.avgApplicationsPerJob}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  isLoading: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, icon: Icon, isLoading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const LoadingSkeleton: React.FC<{ viewMode: 'grid' | 'table' }> = ({ viewMode }) => {
  if (viewMode === 'table') {
    return (
      <Card>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-10 w-3/4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton className="h-8 w-full mt-3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientsOverviewDashboard;
