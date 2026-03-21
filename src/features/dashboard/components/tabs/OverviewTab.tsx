import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Shield, Database, Cpu, Mail, Clock, RefreshCw } from 'lucide-react';
import { AdminEmailUtility } from '@/features/admin/components/AdminEmailUtility';
import { useRecruiterSLA } from '@/features/admin/hooks/useRecruiterSLA';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  created_at: string | null;
  user_id: string | null;
}

interface OverviewTabProps {
  recentActivity: AuditLog[] | undefined;
}

const formatHours = (hours: number): string => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const getActivityBadgeStyle = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('sync')) return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
  if (a.includes('error') || a.includes('delete')) return 'bg-red-500/15 text-red-400 border-red-500/20';
  if (a.includes('login') || a.includes('create') || a.includes('insert')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
};

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ recentActivity }) => {
  const { data: sla, isLoading: slaLoading } = useRecruiterSLA(30);

  const systemServices = [
    { name: 'Database', icon: Database, status: 'Operational', uptime: '99.99%' },
    { name: 'Edge Functions', icon: Cpu, status: 'Operational', uptime: '99.95%' },
    { name: 'API Services', icon: Activity, status: 'Operational', uptime: '99.98%' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recruiter SLA Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recruiter Response SLA</CardTitle>
              <CardDescription className="text-xs">First response time (30 days)</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/15">
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {slaLoading ? (
              <div className="h-24 bg-muted animate-pulse rounded" />
            ) : sla ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold">{formatHours(sla.avgResponseHours)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Avg Response</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-2xl font-bold">{formatHours(sla.medianResponseHours)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Median Response</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] mb-1">
                      &lt;1h
                    </Badge>
                    <p className="font-semibold text-sm">{sla.withinOneHour}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] mb-1">
                      &lt;4h
                    </Badge>
                    <p className="font-semibold text-sm">{sla.withinFourHours}</p>
                  </div>
                  <div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] mb-1">
                      &lt;24h
                    </Badge>
                    <p className="font-semibold text-sm">{sla.withinTwentyFourHours}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {sla.respondedCount} of {sla.totalApplications} responded ({sla.responseRate.toFixed(0)}%)
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No SLA data yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">SLA tracking begins when recruiters respond to applications</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription className="text-xs">Latest system events</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/15">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 py-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0", getActivityBadgeStyle(log.action))}
                        >
                          {log.action}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{log.table_name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">System Status</CardTitle>
              <CardDescription className="text-xs">Infrastructure health</CardDescription>
            </div>
            <div className="p-2 rounded-lg bg-green-500/15">
              <Shield className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemServices.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <svc.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{svc.uptime}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-xs text-green-500">{svc.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Run Health Check
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Email Utilities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Email Utilities</CardTitle>
            <CardDescription className="text-xs">Send system emails to users</CardDescription>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/15">
            <Mail className="h-4 w-4 text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <AdminEmailUtility />
        </CardContent>
      </Card>
    </div>
  );
};
