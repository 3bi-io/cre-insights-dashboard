import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2 } from 'lucide-react';

interface RelatedJobsProps {
  currentJobId: string;
  clientId?: string | null;
  categoryId?: string | null;
  organizationId?: string | null;
}

export const RelatedJobs: React.FC<RelatedJobsProps> = ({
  currentJobId,
  clientId,
  categoryId,
  organizationId,
}) => {
  const { data: relatedJobs, isLoading } = useQuery({
    queryKey: ['related-jobs', currentJobId, clientId, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select(`
          id,
          title,
          job_title,
          location,
          city,
          state,
          clients(name),
          job_categories(name)
        `)
        .eq('status', 'active')
        .neq('id', currentJobId)
        .limit(4);

      // Exclude acme organization
      const { data: acmeOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'acme')
        .maybeSingle();

      if (acmeOrg?.id) {
        query = query.neq('organization_id', acmeOrg.id);
      }

      // Prioritize same client, then same category
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // If not enough results from client/category, fetch more
      if (data && data.length < 4) {
        const existingIds = [currentJobId, ...data.map(j => j.id)];
        let fallbackQuery = supabase
          .from('job_listings')
          .select(`
            id,
            title,
            job_title,
            location,
            city,
            state,
            clients(name),
            job_categories(name)
          `)
          .eq('status', 'active')
          .not('id', 'in', `(${existingIds.join(',')})`)
          .limit(4 - data.length);

        if (acmeOrg?.id) {
          fallbackQuery = fallbackQuery.neq('organization_id', acmeOrg.id);
        }

        const { data: moreJobs } = await fallbackQuery;
        return [...data, ...(moreJobs || [])];
      }

      return data || [];
    },
    enabled: !!currentJobId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Related Jobs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!relatedJobs || relatedJobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Related Jobs</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatedJobs.map((job) => (
          <Link key={job.id} to={`/jobs/${job.id}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1 mb-2">
                  {job.title || job.job_title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="w-3 h-3" />
                  <span className="line-clamp-1">{job.clients?.name || 'Company'}</span>
                </div>
                {(job.location || (job.city && job.state)) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">
                      {job.location || `${job.city}, ${job.state}`}
                    </span>
                  </div>
                )}
                {job.job_categories?.name && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {job.job_categories.name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
