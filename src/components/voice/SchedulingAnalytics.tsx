/**
 * SchedulingAnalytics - Phase 3
 * Callback success rates, recruiter utilization, and scheduling performance
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarCheck, PhoneOff, Clock, TrendingUp, Users, BarChart3,
  CheckCircle2, XCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns';

interface CallbackRow {
  id: string;
  driver_name: string | null;
  driver_phone: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  booking_source: string;
  sms_confirmation_sent: boolean;
  recruiter_id: string | null;
  created_at: string;
  duration_minutes: number;
}

const PIE_COLORS = [
  'hsl(var(--primary))',
  'hsl(142 71% 45%)',
  'hsl(0 84% 60%)',
  'hsl(48 96% 53%)',
  'hsl(var(--muted-foreground))',
];

export function SchedulingAnalytics() {
  const [callbacks, setCallbacks] = useState<CallbackRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, [range]);

  const fetchData = async () => {
    setIsLoading(true);
    const since = subDays(new Date(), parseInt(range)).toISOString();
    const { data, error } = await supabase
      .from('scheduled_callbacks')
      .select('*')
      .gte('created_at', since)
      .order('scheduled_start', { ascending: true })
      .limit(1000);

    if (!error && data) {
      setCallbacks(data as unknown as CallbackRow[]);
    }
    setIsLoading(false);
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const total = callbacks.length;
    const completed = callbacks.filter(c => c.status === 'completed').length;
    const noShow = callbacks.filter(c => c.status === 'no_show').length;
    const cancelled = callbacks.filter(c => c.status === 'cancelled').length;
    const pending = callbacks.filter(c => c.status === 'pending' || c.status === 'confirmed').length;
    const smsRate = total > 0 ? callbacks.filter(c => c.sms_confirmation_sent).length / total : 0;
    const completionRate = total > 0 ? completed / total : 0;
    const noShowRate = total > 0 ? noShow / total : 0;

    return { total, completed, noShow, cancelled, pending, smsRate, completionRate, noShowRate };
  }, [callbacks]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    callbacks.forEach(c => {
      map[c.status] = (map[c.status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [callbacks]);

  // Daily trend data
  const dailyTrend = useMemo(() => {
    const days = parseInt(range);
    const interval = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    });

    return interval.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayCallbacks = callbacks.filter(
        c => format(parseISO(c.scheduled_start), 'yyyy-MM-dd') === dayStr
      );
      return {
        date: format(day, 'MMM dd'),
        scheduled: dayCallbacks.length,
        completed: dayCallbacks.filter(c => c.status === 'completed').length,
        no_show: dayCallbacks.filter(c => c.status === 'no_show').length,
      };
    });
  }, [callbacks, range]);

  // Recruiter utilization
  const recruiterStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number; noShow: number }> = {};
    callbacks.forEach(c => {
      const rid = c.recruiter_id || 'unassigned';
      if (!map[rid]) map[rid] = { total: 0, completed: 0, noShow: 0 };
      map[rid].total++;
      if (c.status === 'completed') map[rid].completed++;
      if (c.status === 'no_show') map[rid].noShow++;
    });
    return Object.entries(map)
      .map(([id, stats]) => ({
        recruiter: id === 'unassigned' ? 'Unassigned' : id.slice(0, 8),
        ...stats,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [callbacks]);

  // Hour-of-day heatmap data
  const hourlyDistribution = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, count: 0, completed: 0 }));
    callbacks.forEach(c => {
      const h = parseISO(c.scheduled_start).getHours();
      hours[h].count++;
      if (c.status === 'completed') hours[h].completed++;
    });
    return hours.filter(h => h.count > 0);
  }, [callbacks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scheduling Analytics</h3>
          <p className="text-sm text-muted-foreground">AI callback performance & recruiter utilization</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Callbacks</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <p className="text-xs text-muted-foreground">{kpis.pending} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.completionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{kpis.completed} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <PhoneOff className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.noShowRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{kpis.noShow} no-shows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Confirmation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(kpis.smsRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">confirmation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Daily Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Callback Trend</CardTitle>
            <CardDescription>Scheduled vs completed vs no-show</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="scheduled" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Scheduled" />
                  <Bar dataKey="completed" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Completed" />
                  <Bar dataKey="no_show" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} name="No-Show" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
            <CardDescription>Callback outcome distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recruiter Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Recruiter Utilization
            </CardTitle>
            <CardDescription>Callbacks per recruiter & completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            {recruiterStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={recruiterStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis dataKey="recruiter" type="category" width={80} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'rate') return [`${value}%`, 'Completion Rate'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(142 71% 45%)" stackId="a" name="Completed" />
                  <Bar dataKey="noShow" fill="hsl(0 84% 60%)" stackId="a" name="No-Show" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No recruiter data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Peak Scheduling Hours
            </CardTitle>
            <CardDescription>When callbacks are most scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="completed" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                No hourly data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
