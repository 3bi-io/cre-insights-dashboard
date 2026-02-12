import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend,
} from 'recharts';
import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
import { X } from 'lucide-react';
import type { PortfolioClientRow } from '../../types/clientAnalytics.types';

interface Props {
  clients: PortfolioClientRow[];
  selectedIds: string[];
  onToggleClient: (clientId: string) => void;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
];

export const ClientComparison: React.FC<Props> = ({ clients, selectedIds, onToggleClient }) => {
  const selected = clients.filter(c => selectedIds.includes(c.id));

  if (selected.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Client Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select 2-3 clients from the leaderboard to compare. Click client rows to select.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {selected.map(c => (
              <Button
                key={c.id}
                variant="outline"
                size="sm"
                onClick={() => onToggleClient(c.id)}
                className="gap-2"
              >
                {c.name}
                <X className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normalize metrics to 0-100 scale
  const maxApps = Math.max(...selected.map(c => c.applicationCount), 1);
  const maxSla = Math.max(...selected.map(c => c.avgSlaHours), 1);

  const radarData = [
    {
      metric: 'Apps Volume',
      ...Object.fromEntries(selected.map(c => [c.name, Math.round((c.applicationCount / maxApps) * 100)])),
    },
    {
      metric: 'Delivery Rate',
      ...Object.fromEntries(selected.map(c => [c.name, c.atsDeliveryRate])),
    },
    {
      metric: 'Readiness',
      ...Object.fromEntries(selected.map(c => [c.name, c.avgReadinessScore])),
    },
    {
      metric: 'SLA Speed',
      ...Object.fromEntries(selected.map(c => [c.name, maxSla > 0 ? Math.round((1 - c.avgSlaHours / maxSla) * 100) : 50])),
    },
    {
      metric: 'Recent Activity',
      ...Object.fromEntries(selected.map(c => [c.name, Math.min(c.recentApplications * 10, 100)])),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Client Comparison</CardTitle>
          <div className="flex gap-1">
            {selected.map(c => (
              <Button
                key={c.id}
                variant="outline"
                size="sm"
                onClick={() => onToggleClient(c.id)}
                className="gap-1 h-7 text-xs"
              >
                {c.name}
                <X className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              {selected.map((c, i) => (
                <Radar
                  key={c.id}
                  name={c.name}
                  dataKey={c.name}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
