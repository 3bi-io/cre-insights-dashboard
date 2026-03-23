import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import JobAnalyticsDialog from '@/components/JobAnalyticsDialog';

interface JobPerformanceSectionProps {
  clientId: string;
  dateRange: string;
}

const getDateCutoff = (range: string) => {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : null;
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const JobPerformanceSection: React.FC<JobPerformanceSectionProps> = ({ clientId, dateRange }) => {
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: jobPerf, isLoading } = useQuery({
    queryKey: ['client-portal-job-perf', clientId, dateRange],
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('*')
        .eq('client_id', clientId);

      if (!jobs?.length) return [];

      const jobIds = jobs.map(j => j.id);
      let query = supabase
        .from('applications')
        .select('job_listing_id, ats_readiness_score, tenstreet_sync_status, driverreach_sync_status')
        .in('job_listing_id', jobIds);

      const cutoff = getDateCutoff(dateRange);
      if (cutoff) query = query.gte('applied_at', cutoff);

      const { data: apps } = await query;

      return jobs.map(job => {
        const jobApps = (apps || []).filter(a => a.job_listing_id === job.id);
        const scores = jobApps.map(a => a.ats_readiness_score).filter((s): s is number => s != null);
        const avgReadiness = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const delivered = jobApps.filter(a => a.tenstreet_sync_status === 'synced' || a.driverreach_sync_status === 'synced').length;
        const deliveryRate = jobApps.length > 0 ? Math.round((delivered / jobApps.length) * 100) : 0;

        return {
          ...job,
          applications: jobApps.length,
          avgReadiness,
          deliveryRate,
        };
      }).sort((a, b) => b.applications - a.applications);
    },
    enabled: !!clientId,
  });

  const handleJobClick = (jobId: string) => {
    const job = jobPerf?.find(j => j.id === jobId);
    if (job) {
      setSelectedJob(job);
      setShowDialog(true);
    }
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="w-5 h-5 text-amber-400" />
            Job Performance
          </CardTitle>
          <p className="text-sm text-muted-foreground">Click a job to preview its description and details</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : !jobPerf?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No job listings yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobPerf.map(job => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 rounded-lg bg-muted/30 border border-border/30 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleJobClick(job.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{job.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{job.applications} applicant{job.applications !== 1 ? 's' : ''}</span>
                      <span>Readiness: {job.avgReadiness}/100</span>
                      <span>Delivery: {job.deliveryRate}%</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={job.status === 'active'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-muted text-muted-foreground'
                    }
                  >
                    {job.status === 'active' ? 'Active' : job.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedJob && (
        <JobAnalyticsDialog
          job={selectedJob}
          open={showDialog}
          onOpenChange={setShowDialog}
        />
      )}
    </>
  );
};
