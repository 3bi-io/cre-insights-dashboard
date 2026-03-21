import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import type { ClientApplication } from '../../hooks/useClientApplications';
import { STAGES } from './stageConfig';

interface ClientAnalyticsTabProps {
  applications: ClientApplication[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899'];

const ClientAnalyticsTab: React.FC<ClientAnalyticsTabProps> = ({ applications }) => {
  // Volume trend by week
  const volumeTrend = useMemo(() => {
    const weekMap: Record<string, number> = {};
    applications.forEach(a => {
      if (!a.applied_at) return;
      const d = new Date(a.applied_at);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    return Object.entries(weekMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([week, count]) => ({ week: week.slice(5), count }));
  }, [applications]);

  // Source breakdown
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(a => {
      const s = a.source || 'Unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [applications]);

  // Stage conversion funnel
  const funnelData = useMemo(() => {
    const total = applications.length;
    if (total === 0) return [];
    const counts: Record<string, number> = {};
    applications.forEach(a => {
      const s = a.status || 'pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return STAGES.map(s => ({
      stage: s.label,
      count: counts[s.id] || 0,
      rate: total > 0 ? Math.round(((counts[s.id] || 0) / total) * 100) : 0,
    }));
  }, [applications]);

  // Time-to-hire
  const timeToHire = useMemo(() => {
    const hiredApps = applications.filter(a => a.status === 'hired' && a.applied_at);
    if (hiredApps.length === 0) return null;
    const days = hiredApps.map(a => {
      const applied = new Date(a.applied_at!).getTime();
      const updated = new Date(a.updated_at || a.created_at || '').getTime();
      return Math.round((updated - applied) / (1000 * 60 * 60 * 24));
    });
    return Math.round(days.reduce((a, b) => a + b, 0) / days.length);
  }, [applications]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total Applications</div>
            <div className="text-3xl font-bold mt-1">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg Time-to-Hire</div>
            <div className="text-3xl font-bold mt-1">{timeToHire != null ? `${timeToHire}d` : 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Hire Rate</div>
            <div className="text-3xl font-bold mt-1">
              {applications.length > 0 ? `${Math.round((applications.filter(a => a.status === 'hired').length / applications.length) * 100)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volume Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Application Volume (Weekly)</CardTitle>
        </CardHeader>
        <CardContent>
          {volumeTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={volumeTrend}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Source Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {sourceData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {sourceData.map((s, idx) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-medium">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Stage Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stage Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            {funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={funnelData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => [v, 'Count']} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientAnalyticsTab;
