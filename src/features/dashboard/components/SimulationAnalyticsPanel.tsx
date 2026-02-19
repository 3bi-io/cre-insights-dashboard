import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Users, TrendingDown, CheckCircle2, ArrowRight, Bell } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SimEvent {
  event_type: string;
  step_number: number | null;
  country: string | null;
  country_code: string | null;
  session_id: string;
  created_at: string;
}

interface StepFunnel {
  step: string;
  reached: number;
  label: string;
}

const STEP_LABELS: Record<number, string> = {
  1: 'Personal Info',
  2: 'CDL Info',
  3: 'Background',
  4: 'Consent',
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/40 border border-border">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function SimulationAnalyticsPanel() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events = [], isLoading } = useQuery<SimEvent[]>({
    queryKey: ['simulation-events'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('simulation_events') as any)
        .select('event_type, step_number, country, country_code, session_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  // ── Derived metrics ──────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const sessions = new Set(events.map((e) => e.session_id));
    const starts = events.filter((e) => e.event_type === 'session_start');
    const completes = events.filter((e) => e.event_type === 'simulation_complete');
    const waitlists = events.filter((e) => e.event_type === 'waitlist_joined');
    const dropoffs = events.filter((e) => e.event_type === 'step_dropoff');

    const completionRate =
      starts.length > 0 ? Math.round((completes.length / starts.length) * 100) : 0;
    const waitlistRate =
      completes.length > 0 ? Math.round((waitlists.length / completes.length) * 100) : 0;

    // Country breakdown (top 8)
    const countryCounts: Record<string, { country: string; count: number }> = {};
    starts.forEach((e) => {
      const key = e.country_code ?? 'Unknown';
      if (!countryCounts[key]) countryCounts[key] = { country: e.country ?? key, count: 0 };
      countryCounts[key].count++;
    });
    const topCountries = Object.entries(countryCounts)
      .map(([code, v]) => ({ code, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Step funnel — how many sessions reached each step
    const stepReached: Record<number, Set<string>> = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() };
    events
      .filter((e) => e.event_type === 'step_complete' && e.step_number != null)
      .forEach((e) => stepReached[e.step_number!]?.add(e.session_id));
    // Session start counts as reaching step 1 intent
    starts.forEach((e) => stepReached[1].add(e.session_id));

    const funnel: StepFunnel[] = [1, 2, 3, 4].map((n) => ({
      step: STEP_LABELS[n],
      reached: n === 1 ? starts.length : (stepReached[n].size || 0),
      label: `Step ${n}`,
    }));

    // Top drop-off step
    const dropCounts: Record<number, number> = {};
    dropoffs.forEach((e) => {
      if (e.step_number != null) dropCounts[e.step_number] = (dropCounts[e.step_number] || 0) + 1;
    });
    const topDropStep = Object.entries(dropCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      totalSessions: sessions.size,
      totalStarts: starts.length,
      totalCompletes: completes.length,
      totalWaitlists: waitlists.length,
      completionRate,
      waitlistRate,
      topCountries,
      funnel,
      topDropStep: topDropStep ? { step: Number(topDropStep[0]), count: Number(topDropStep[1]) } : null,
    };
  }, [events]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (metrics.totalStarts === 0) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <Globe className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            No simulation sessions recorded yet. Events appear here once international users
            visit an apply page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          icon={Globe}
          label="Total Sessions"
          value={metrics.totalSessions}
          sub="Unique simulation sessions"
        />
        <StatTile
          icon={CheckCircle2}
          label="Completed"
          value={`${metrics.completionRate}%`}
          sub={`${metrics.totalCompletes} of ${metrics.totalStarts}`}
        />
        <StatTile
          icon={TrendingDown}
          label="Top Drop-off"
          value={
            metrics.topDropStep
              ? `Step ${metrics.topDropStep.step}`
              : '—'
          }
          sub={
            metrics.topDropStep
              ? `${metrics.topDropStep.count} sessions dropped`
              : 'No drop-offs yet'
          }
        />
        <StatTile
          icon={Bell}
          label="Waitlist Joins"
          value={metrics.totalWaitlists}
          sub={`${metrics.waitlistRate}% of completions`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              Step Completion Funnel
            </CardTitle>
            <CardDescription className="text-xs">
              Sessions reaching each step of the simulation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics.funnel} barSize={32}>
                <XAxis
                  dataKey="step"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(v: number) => [v, 'Sessions']}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="reached" radius={[6, 6, 0, 0]}>
                  {metrics.funnel.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Sessions by Country
            </CardTitle>
            <CardDescription className="text-xs">
              Top countries triggering simulation mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.topCountries.map((c, i) => (
                <div key={c.code} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-6 shrink-0">
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs truncate text-foreground">{c.country}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 ml-2 shrink-0">
                        {c.count}
                      </Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${Math.round((c.count / metrics.topCountries[0].count) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
