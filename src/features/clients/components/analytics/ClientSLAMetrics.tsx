import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { SLAMetrics } from '../../types/clientAnalytics.types';

interface Props {
  data: SLAMetrics;
}

export const ClientSLAMetrics: React.FC<Props> = ({ data }) => {
  const total = data.within24h + data.within48h + data.over48h;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Recruiter SLA</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {data.totalWithResponse === 0 ? (
          <p className="text-sm text-muted-foreground">No response data available.</p>
        ) : (
          <div className="space-y-4">
            {/* Average & Median */}
            <div className="flex gap-4">
              <div>
                <div className="text-2xl font-bold">{data.avgResponseHours}h</div>
                <div className="text-xs text-muted-foreground">Avg response</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{data.medianResponseHours}h</div>
                <div className="text-xs text-muted-foreground">Median</div>
              </div>
            </div>

            {/* Distribution bars */}
            {total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Distribution</span>
                  <span className="text-muted-foreground">{total} responses</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  {data.within24h > 0 && (
                    <div
                      className="bg-success"
                      style={{ width: `${(data.within24h / total) * 100}%` }}
                      title={`Within 24h: ${data.within24h}`}
                    />
                  )}
                  {data.within48h > 0 && (
                    <div
                      className="bg-warning"
                      style={{ width: `${(data.within48h / total) * 100}%` }}
                      title={`24-48h: ${data.within48h}`}
                    />
                  )}
                  {data.over48h > 0 && (
                    <div
                      className="bg-destructive"
                      style={{ width: `${(data.over48h / total) * 100}%` }}
                      title={`Over 48h: ${data.over48h}`}
                    />
                  )}
                </div>
                <div className="flex gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span>&lt;24h ({data.within24h})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span>24-48h ({data.within48h})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span>&gt;48h ({data.over48h})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
