import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { DailyTrend } from '../../types/clientAnalytics.types';

interface Props {
  data: DailyTrend[];
}

export const ClientTrendChart: React.FC<Props> = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Application Trends</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">No trend data available.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Application Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                name="Applications"
              />
              <Line
                type="monotone"
                dataKey="deliveries"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={false}
                name="Deliveries"
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
