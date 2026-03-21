import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, CheckCircle, AlertTriangle, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ATSDeliveryStats } from '@/features/clients/types/clientAnalytics.types';

interface ATSDeliverySectionProps {
  data: ATSDeliveryStats;
}

export const ATSDeliverySection: React.FC<ATSDeliverySectionProps> = ({ data }) => {
  const total = data.total || 1;
  const successPct = Math.round((data.success / total) * 100);
  const errorPct = Math.round((data.error / total) * 100);
  const pendingPct = Math.round((data.pending / total) * 100);
  const sentPct = Math.round((data.sent / total) * 100);
  const noData = data.total === 0 && data.success === 0 && data.error === 0;

  const tiles = [
    { label: 'Total Submitted', value: data.total, icon: Send, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Delivered', value: data.success, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Errors', value: data.error, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Pending', value: data.pending, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  if (noData) {
    return (
      <Card className="border-border/50 border-dashed">
        <CardContent className="py-8 text-center">
          <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">ATS Integration Setup Required</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Connect your Applicant Tracking System to automatically deliver candidate data. Contact your recruiter to set up the integration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="w-5 h-5 text-violet-400" />
          ATS Delivery Status
        </CardTitle>
        <p className="text-sm text-muted-foreground">Application delivery to your ATS system</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map(tile => {
            const Icon = tile.icon;
            return (
              <div key={tile.label} className={`rounded-lg ${tile.bg} p-3 text-center`}>
                <Icon className={`w-5 h-5 mx-auto mb-1 ${tile.color}`} />
                <p className="text-2xl font-bold text-foreground">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            );
          })}
        </div>
        {/* Stacked progress bar */}
        <div className="h-3 rounded-full overflow-hidden flex bg-muted">
          {data.success > 0 && (
            <div className="bg-emerald-500 transition-all" style={{ width: `${successPct}%` }} title={`Success: ${successPct}%`} />
          )}
          {data.pending > 0 && (
            <div className="bg-amber-500 transition-all" style={{ width: `${pendingPct}%` }} title={`Pending: ${pendingPct}%`} />
          )}
          {data.error > 0 && (
            <div className="bg-red-500 transition-all" style={{ width: `${errorPct}%` }} title={`Error: ${errorPct}%`} />
          )}
          {data.sent > 0 && data.success === 0 && data.pending === 0 && data.error === 0 && (
            <div className="bg-blue-500 transition-all" style={{ width: `${sentPct}%` }} title={`Sent: ${sentPct}%`} />
          )}
        </div>
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Success</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Pending</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Error</span>
        </div>
      </CardContent>
    </Card>
  );
};
