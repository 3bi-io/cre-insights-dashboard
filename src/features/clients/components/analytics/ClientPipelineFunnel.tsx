import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { PipelineStage } from '../../types/clientAnalytics.types';

const STAGE_COLORS: Record<string, string> = {
  pending: 'hsl(var(--muted-foreground))',
  reviewed: 'hsl(var(--info))',
  contacted: 'hsl(var(--accent))',
  interviewed: 'hsl(var(--secondary))',
  offered: 'hsl(var(--warning))',
  hired: 'hsl(var(--success))',
  rejected: 'hsl(var(--destructive))',
  withdrawn: 'hsl(var(--muted-foreground))',
};

interface Props {
  data: PipelineStage[];
}

export const ClientPipelineFunnel: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Pipeline</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No pipeline data available.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Application Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fontSize: 12 }}
                width={80}
                tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
              />
              <Tooltip
                formatter={(value: number, _name: string, props: any) =>
                  [`${value} (${props.payload.percentage}%)`, 'Applications']
                }
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.stage} fill={STAGE_COLORS[entry.stage] || 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
