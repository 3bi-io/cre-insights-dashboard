import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ATSDeliveryStats } from '../../types/clientAnalytics.types';

interface Props {
  data: ATSDeliveryStats;
}

export const ClientATSDeliveryStatus: React.FC<Props> = ({ data }) => {
  const chartData = [
    { name: 'Total', value: data.total, color: 'hsl(var(--muted-foreground))' },
    { name: 'Sent', value: data.sent, color: 'hsl(var(--info))' },
    { name: 'Success', value: data.success, color: 'hsl(var(--success))' },
    { name: 'Error', value: data.error, color: 'hsl(var(--destructive))' },
    { name: 'Pending', value: data.pending, color: 'hsl(var(--warning))' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">ATS Delivery</CardTitle>
          {data.sent > 0 && (
            <span className="text-sm font-medium text-success">{data.successRate}% success</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.total === 0 ? (
          <p className="text-sm text-muted-foreground">No delivery data available.</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
