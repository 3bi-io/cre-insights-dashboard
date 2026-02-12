import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowUpDown, BarChart3 } from 'lucide-react';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { PortfolioClientRow, LeaderboardSortField } from '../../types/clientAnalytics.types';

interface Props {
  clients: PortfolioClientRow[];
  isLoading: boolean;
  onSelectClient: (clientId: string) => void;
}

type SortDir = 'asc' | 'desc';

export const ClientLeaderboard: React.FC<Props> = ({ clients, isLoading, onSelectClient }) => {
  const [sortField, setSortField] = useState<LeaderboardSortField>('applicationCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    return [...clients].sort((a, b) => {
      const diff = a[sortField] - b[sortField];
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [clients, sortField, sortDir]);

  const handleSort = (field: LeaderboardSortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  const SortBtn = ({ field, label }: { field: LeaderboardSortField; label: string }) => (
    <Button variant="ghost" size="sm" onClick={() => handleSort(field)} className="gap-1 -ml-2 text-xs">
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Client</TableHead>
                <TableHead className="text-right"><SortBtn field="applicationCount" label="Apps" /></TableHead>
                <TableHead className="text-right"><SortBtn field="recentApplications" label="30d" /></TableHead>
                <TableHead className="text-right"><SortBtn field="atsDeliveryRate" label="Delivery %" /></TableHead>
                <TableHead className="text-right"><SortBtn field="avgReadinessScore" label="Readiness" /></TableHead>
                <TableHead className="text-right"><SortBtn field="avgSlaHours" label="SLA (h)" /></TableHead>
                <TableHead className="w-[80px]">Trend</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(client => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectClient(client.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LogoAvatar size="sm" className="w-8 h-8">
                        {client.logoUrl ? (
                          <LogoAvatarImage src={client.logoUrl} alt={client.name} />
                        ) : (
                          <LogoAvatarFallback iconSize="sm" />
                        )}
                      </LogoAvatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{client.name}</div>
                        {(client.city || client.state) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {[client.city, client.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{client.applicationCount}</TableCell>
                  <TableCell className="text-right">
                    {client.recentApplications > 0 ? (
                      <span className="text-success font-medium">+{client.recentApplications}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        client.atsDeliveryRate >= 80 ? 'border-success/30 text-success' :
                        client.atsDeliveryRate >= 50 ? 'border-warning/30 text-warning' :
                        client.atsDeliveryRate > 0 ? 'border-destructive/30 text-destructive' :
                        'text-muted-foreground'
                      }
                    >
                      {client.atsDeliveryRate > 0 ? `${client.atsDeliveryRate}%` : '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{client.avgReadinessScore || '—'}</TableCell>
                  <TableCell className="text-right">
                    {client.avgSlaHours > 0 ? `${client.avgSlaHours}h` : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="w-16 h-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={client.sparklineData.map((v, i) => ({ v, i }))}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke="hsl(var(--primary))"
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
