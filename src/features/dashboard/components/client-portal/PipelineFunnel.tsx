import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';
import type { PipelineStage } from '@/features/clients/types/clientAnalytics.types';

interface PipelineFunnelProps {
  data: PipelineStage[];
  totalApplications: number;
}

// Fixed stage definitions with chevron colors
const FUNNEL_STAGES = [
  { key: 'new', label: 'New', colorClass: 'bg-slate-600', textClass: 'text-slate-100' },
  { key: 'reviewing', label: 'Reviewing', colorClass: 'bg-blue-600', textClass: 'text-blue-100' },
  { key: 'phone_screen', label: 'Phone Screen', colorClass: 'bg-violet-600', textClass: 'text-violet-100' },
  { key: 'interview', label: 'Interview', colorClass: 'bg-amber-600', textClass: 'text-amber-100' },
  { key: 'offer', label: 'Offer', colorClass: 'bg-emerald-600', textClass: 'text-emerald-100' },
  { key: 'hired', label: 'Hired', colorClass: 'bg-green-600', textClass: 'text-green-100' },
];

const REJECTED_STAGE = { key: 'rejected', label: 'Rejected', colorClass: 'bg-red-800', textClass: 'text-red-100' };

// Map raw status values to our stage keys
const STATUS_MAP: Record<string, string> = {
  pending: 'new',
  new: 'new',
  reviewed: 'reviewing',
  reviewing: 'reviewing',
  contacted: 'phone_screen',
  'phone screen': 'phone_screen',
  phone_screen: 'phone_screen',
  interviewed: 'interview',
  interview: 'interview',
  offered: 'offer',
  offer: 'offer',
  hired: 'hired',
  accepted: 'hired',
  rejected: 'rejected',
  withdrawn: 'rejected',
};

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ data, totalApplications }) => {
  // Aggregate data into our fixed stages
  const stageCounts: Record<string, number> = {};
  FUNNEL_STAGES.forEach(s => { stageCounts[s.key] = 0; });
  stageCounts[REJECTED_STAGE.key] = 0;

  data.forEach(d => {
    const mapped = STATUS_MAP[d.stage.toLowerCase()] || 'new';
    stageCounts[mapped] = (stageCounts[mapped] || 0) + d.count;
  });

  const allStages = [...FUNNEL_STAGES, REJECTED_STAGE];

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
          <div className="flex items-stretch overflow-x-auto pb-1">
            {allStages.map((stage, idx) => {
              const count = stageCounts[stage.key] || 0;
              const pct = totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
              const isLast = idx === allStages.length - 1;
              const isRejected = stage.key === 'rejected';

              return (
                <React.Fragment key={stage.key}>
                  {/* Separator pipe before Rejected */}
                  {isRejected && (
                    <div className="flex items-center px-2">
                      <div className="w-px h-12 bg-border" />
                    </div>
                  )}
                  <div className="flex items-stretch flex-1 min-w-[100px]">
                    {/* Chevron block */}
                    <div className={`${stage.colorClass} relative flex-1 flex flex-col items-center justify-center py-4 px-3 ${idx === 0 ? 'rounded-l-lg' : ''} ${isLast ? 'rounded-r-lg' : ''}`}>
                      <span className="text-2xl font-bold text-white">{count}</span>
                      <span className={`text-[11px] font-semibold ${stage.textClass} mt-0.5 whitespace-nowrap`}>{stage.label}</span>
                      <span className="text-[10px] text-white/60">{pct}%</span>
                    </div>
                    {/* Arrow connector */}
                    {!isLast && !isRejected && idx < FUNNEL_STAGES.length - 1 && (
                      <div className="flex items-center -mx-[1px] z-10">
                        <svg width="16" height="64" viewBox="0 0 16 64" className="block">
                          <polygon points="0,0 16,32 0,64" className="fill-muted/60" />
                        </svg>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
