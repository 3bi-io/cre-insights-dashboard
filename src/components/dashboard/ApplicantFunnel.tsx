import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/queryKeys';

export const ApplicantFunnel = () => {
  const { organization } = useAuth();

  const { data: funnelData, isLoading } = useQuery({
    queryKey: queryKeys.analytics.funnel(organization?.id),
    queryFn: async () => {
      if (!organization?.id) return null;

      // Get all applications for the organization
      const { data: applications } = await supabase
        .from('applications')
        .select('status, job_listings!inner(organization_id)')
        .eq('job_listings.organization_id', organization.id);

      if (!applications) return null;

      const total = applications.length;
      const pending = applications.filter(a => a.status === 'pending').length;
      const reviewed = applications.filter(a => a.status === 'reviewed').length;
      const interviewed = applications.filter(a => a.status === 'interviewed').length;
      const accepted = applications.filter(a => a.status === 'accepted').length;

      return [
        { stage: 'Applied', count: total, percentage: 100, color: 'bg-blue-500' },
        { stage: 'Pending Review', count: pending, percentage: (pending / total) * 100, color: 'bg-yellow-500' },
        { stage: 'Reviewed', count: reviewed, percentage: (reviewed / total) * 100, color: 'bg-purple-500' },
        { stage: 'Interviewed', count: interviewed, percentage: (interviewed / total) * 100, color: 'bg-orange-500' },
        { stage: 'Accepted', count: accepted, percentage: (accepted / total) * 100, color: 'bg-green-500' },
      ];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Applicant Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Applicant Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData?.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.stage}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{stage.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`absolute h-full ${stage.color} transition-all duration-500 flex items-center justify-center text-white text-sm font-medium`}
                  style={{ width: `${stage.percentage}%` }}
                >
                  {stage.percentage > 15 && `${stage.percentage.toFixed(0)}%`}
                </div>
              </div>
              {index < (funnelData?.length || 0) - 1 && (
                <div className="flex justify-center">
                  <div className="w-px h-2 bg-border"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
