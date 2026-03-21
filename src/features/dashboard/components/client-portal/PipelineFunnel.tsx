import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, ArrowRight } from 'lucide-react';
import type { PipelineStage } from '@/features/clients/types/clientAnalytics.types';

interface PipelineFunnelProps {
  data: PipelineStage[];
  totalApplications: number;
}

const STAGE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  pending: { color: 'text-slate-300', bg: 'bg-slate-500', border: 'border-slate-500/40' },
  new: { color: 'text-slate-300', bg: 'bg-slate-500', border: 'border-slate-500/40' },
  reviewed: { color: 'text-blue-300', bg: 'bg-blue-500', border: 'border-blue-500/40' },
  reviewing: { color: 'text-blue-300', bg: 'bg-blue-500', border: 'border-blue-500/40' },
  contacted: { color: 'text-violet-300', bg: 'bg-violet-500', border: 'border-violet-500/40' },
  'phone screen': { color: 'text-violet-300', bg: 'bg-violet-500', border: 'border-violet-500/40' },
  interviewed: { color: 'text-amber-300', bg: 'bg-amber-500', border: 'border-amber-500/40' },
  interview: { color: 'text-amber-300', bg: 'bg-amber-500', border: 'border-amber-500/40' },
  offered: { color: 'text-emerald-300', bg: 'bg-emerald-500', border: 'border-emerald-500/40' },
  offer: { color: 'text-emerald-300', bg: 'bg-emerald-500', border: 'border-emerald-500/40' },
  hired: { color: 'text-green-300', bg: 'bg-green-500', border: 'border-green-500/40' },
  accepted: { color: 'text-green-300', bg: 'bg-green-500', border: 'border-green-500/40' },
  rejected: { color: 'text-red-300', bg: 'bg-red-500', border: 'border-red-500/40' },
  withdrawn: { color: 'text-gray-400', bg: 'bg-gray-500', border: 'border-gray-500/40' },
};

const DEFAULT_STAGES = ['New', 'Reviewing', 'Phone Screen', 'Interview', 'Offer', 'Hired'];

const getStageConfig = (stage: string) => {
  return STAGE_CONFIG[stage.toLowerCase()] || { color: 'text-slate-300', bg: 'bg-slate-500', border: 'border-slate-500/40' };
};

const formatStageName = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ data, totalApplications }) => {
  // Build display stages from data, or use defaults
  const displayStages = data.length > 0
    ? data.map(d => ({ name: formatStageName(d.stage), count: d.count, percentage: d.percentage }))
    : DEFAULT_STAGES.map(s => ({ name: s, count: 0, percentage: 0 }));

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <GitBranch className="w-5 h-5 text-primary" />
          Application Pipeline
        </CardTitle>
        <p className="text-sm text-muted-foreground">Candidate progression through hiring stages</p>
      </CardHeader>
      <CardContent>
        {totalApplications === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <GitBranch className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No applications yet</p>
            <p className="text-xs text-muted-foreground mt-1">Pipeline stages will appear as applications come in</p>
          </div>
        ) : (
          <div className="flex items-stretch gap-1 overflow-x-auto pb-2">
            {displayStages.map((stage, idx) => {
              const config = getStageConfig(stage.name);
              const widthPercent = totalApplications > 0 ? Math.max((stage.count / totalApplications) * 100, 8) : 100 / displayStages.length;
              
              return (
                <React.Fragment key={stage.name}>
                  <div
                    className="flex-1 min-w-[100px] relative"
                    style={{ flex: `${widthPercent} 1 0%` }}
                  >
                    <div className={`rounded-lg border ${config.border} p-3 h-full flex flex-col items-center justify-center ${config.bg}/10`}>
                      <span className="text-2xl font-bold text-foreground">{stage.count}</span>
                      <span className={`text-xs font-medium ${config.color} mt-1`}>{stage.name}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{stage.percentage}%</span>
                    </div>
                  </div>
                  {idx < displayStages.length - 1 && (
                    <div className="flex items-center px-0.5 text-muted-foreground/40">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
