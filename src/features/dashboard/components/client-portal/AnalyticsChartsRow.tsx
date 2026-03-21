import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { DailyTrend, SourceBreakdown } from '@/features/clients/types/clientAnalytics.types';

interface AnalyticsChartsRowProps {
  trends: DailyTrend[];
  sources: SourceBreakdown[];
  totalApplications: number;
}

const SOURCE_COLORS: Record<string, string> = {
  ziprecruiter: '#3b82f6',
  indeed: '#8b5cf6',
  direct: '#10b981',
  linkedin: '#06b6d4',
  'direct application': '#10b981',
  facebook: '#f59e0b',
  other: '#64748b',
};

const getSourceColor = (source: string, idx: number) => {
  const fallbacks = ['#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#64748b'];
  return SOURCE_COLORS[source.toLowerCase()] || fallbacks[idx % fallbacks.length];
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value} applications</p>
    </div>
  );
};

export const AnalyticsChartsRow: React.FC<AnalyticsChartsRowProps> = ({ trends, sources, totalApplications }) => {
  const formattedTrends = trends.map(t => ({
    ...t,
    displayDate: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Application Trends - 60% */}
      <Card className="lg:col-span-3 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Application Trends
          </CardTitle>
          <p className="text-sm text-muted-foreground">Daily application volume</p>
        </CardHeader>
        <CardContent>
          {formattedTrends.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="displayDate"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals={false}
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#trendFill)"
                    dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center">
              <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No trend data available</p>
              <p className="text-xs text-muted-foreground mt-1">Trends appear as applications are submitted</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Source Attribution - 40% */}
      <Card className="lg:col-span-2 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="w-5 h-5 text-violet-400" />
            Source Attribution
          </CardTitle>
          <p className="text-sm text-muted-foreground">Where applicants come from</p>
        </CardHeader>
        <CardContent>
          {sources.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="count"
                      nameKey="source"
                      stroke="none"
                    >
                      {sources.map((entry, idx) => (
                        <Cell key={entry.source} fill={getSourceColor(entry.source, idx)} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-foreground text-2xl font-bold">
                      {totalApplications}
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground text-[10px]">
                      total
                    </text>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                            <p className="font-semibold">{d.source}</p>
                            <p className="text-muted-foreground">{d.count} ({d.percentage}%)</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-1.5 mt-2">
                {sources.map((s, idx) => (
                  <div key={s.source} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getSourceColor(s.source, idx) }} />
                    <span className="text-muted-foreground truncate flex-1">{s.source}</span>
                    <span className="font-medium text-foreground">{s.count}</span>
                    <span className="text-muted-foreground w-10 text-right">{s.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-center">
              <PieChartIcon className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No source data</p>
              <p className="text-xs text-muted-foreground mt-1">Source breakdown appears with application data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
