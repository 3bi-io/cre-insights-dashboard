import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { cn } from '@/lib/utils';
import {
  Users, Clock, CheckCircle2, XCircle, TrendingUp, Send,
  MapPin, Mail, Phone, Pencil,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Client } from '../../types/client.types';
import type { ClientApplication } from '../../hooks/useClientApplications';

interface ClientOverviewTabProps {
  client: Client;
  applications: ClientApplication[];
  onEditClient: () => void;
}

const PIPELINE_STAGES = ['pending', 'reviewed', 'contacted', 'interviewed', 'offered', 'hired', 'rejected'];
const STAGE_COLORS: Record<string, string> = {
  pending: 'bg-slate-500',
  reviewed: 'bg-blue-500',
  contacted: 'bg-violet-500',
  interviewed: 'bg-amber-500',
  offered: 'bg-emerald-500',
  hired: 'bg-green-500',
  rejected: 'bg-red-500',
};

const ClientOverviewTab: React.FC<ClientOverviewTabProps> = ({ client, applications, onEditClient }) => {
  const stats = React.useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending' || !a.status).length;
    const hired = applications.filter(a => a.status === 'hired').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;

    const responseTimes = applications
      .filter(a => a.first_response_at && a.applied_at)
      .map(a => (new Date(a.first_response_at!).getTime() - new Date(a.applied_at!).getTime()) / (1000 * 60 * 60));
    const avgResponse = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const atsDelivered = applications.filter(a =>
      a.tenstreet_sync_status === 'synced' || a.driverreach_sync_status === 'synced'
    ).length;
    const atsRate = total > 0 ? Math.round((atsDelivered / total) * 100) : 0;

    const stageCounts: Record<string, number> = {};
    applications.forEach(a => {
      const s = a.status || 'pending';
      stageCounts[s] = (stageCounts[s] || 0) + 1;
    });

    return { total, pending, hired, rejected, avgResponse, atsRate, stageCounts };
  }, [applications]);

  const recentActivity = React.useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.updated_at || b.created_at || '').getTime() - new Date(a.updated_at || a.created_at || '').getTime())
      .slice(0, 10);
  }, [applications]);

  const kpis = [
    { label: 'Total Applicants', value: stats.total, icon: Users, color: 'text-blue-500' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-500' },
    { label: 'Hired', value: stats.hired, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500' },
    { label: 'Avg Response', value: `${stats.avgResponse}h`, icon: TrendingUp, color: 'text-violet-500' },
    { label: 'ATS Delivery', value: `${stats.atsRate}%`, icon: Send, color: 'text-cyan-500' },
  ];

  const location = [client.city, client.state].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <LogoAvatar size="lg">
                {client.logo_url ? (
                  <LogoAvatarImage src={client.logo_url} alt={client.name} />
                ) : (
                  <LogoAvatarFallback iconSize="lg" />
                )}
              </LogoAvatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{client.name}</h2>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                    {client.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                  {location && (
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{location}</span>
                  )}
                  {client.email && (
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>
                  )}
                  {client.phone && (
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEditClient} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={cn('w-4 h-4', kpi.color)} />
              </div>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Application Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {PIPELINE_STAGES.map(stage => {
              const count = stats.stageCounts[stage] || 0;
              const maxCount = Math.max(...Object.values(stats.stageCounts), 1);
              const height = count > 0 ? Math.max((count / maxCount) * 100, 8) : 4;

              return (
                <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium">{count}</span>
                  <div
                    className={cn('w-full rounded-t transition-all', STAGE_COLORS[stage] || 'bg-muted')}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <span className="text-[10px] text-muted-foreground capitalize truncate w-full text-center">
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(app => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-2 h-2 rounded-full', STAGE_COLORS[app.status || 'pending'] || 'bg-muted')} />
                    <div>
                      <span className="text-sm font-medium">
                        {app.first_name} {app.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {app.job_listings?.title || app.job_listings?.job_title || 'No position'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{app.status || 'pending'}</Badge>
                    {app.updated_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(app.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientOverviewTab;
