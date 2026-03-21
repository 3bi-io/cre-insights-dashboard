import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, ChevronLeft, ChevronRight, ArrowUpDown, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface RecentApplicantsTableProps {
  clientId: string;
  dateRange: string;
}

const STAGE_BADGES: Record<string, { label: string; className: string }> = {
  pending: { label: 'New', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  reviewed: { label: 'Reviewed', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  contacted: { label: 'Contacted', className: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  interviewed: { label: 'Interview', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  offered: { label: 'Offer', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  hired: { label: 'Hired', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  accepted: { label: 'Hired', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  rejected: { label: 'Rejected', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
  withdrawn: { label: 'Withdrawn', className: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
};

const SOURCE_COLORS: Record<string, string> = {
  ziprecruiter: 'bg-blue-500/20 text-blue-300',
  indeed: 'bg-violet-500/20 text-violet-300',
  direct: 'bg-emerald-500/20 text-emerald-300',
  'direct application': 'bg-emerald-500/20 text-emerald-300',
  linkedin: 'bg-cyan-500/20 text-cyan-300',
  facebook: 'bg-amber-500/20 text-amber-300',
};

const getDateCutoff = (range: string) => {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : null;
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

const PAGE_SIZE = 15;

export const RecentApplicantsTable: React.FC<RecentApplicantsTableProps> = ({ clientId, dateRange }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['client-portal-applicants', clientId, dateRange],
    queryFn: async () => {
      const { data: jobs } = await supabase
        .from('job_listings')
        .select('id, title')
        .eq('client_id', clientId);

      if (!jobs?.length) return [];

      const jobIds = jobs.map(j => j.id);
      const jobMap = Object.fromEntries(jobs.map(j => [j.id, j.title]));

      let query = supabase
        .from('applications')
        .select('id, first_name, last_name, status, source, applied_at, ats_readiness_score, job_listing_id, tenstreet_sync_status, driverreach_sync_status')
        .in('job_listing_id', jobIds)
        .order('applied_at', { ascending: false })
        .limit(200);

      const cutoff = getDateCutoff(dateRange);
      if (cutoff) query = query.gte('applied_at', cutoff);

      const { data } = await query;
      return (data || []).map(a => ({
        ...a,
        jobTitle: jobMap[a.job_listing_id || ''] || 'Unknown',
      }));
    },
    enabled: !!clientId,
  });

  const filtered = useMemo(() => {
    let items = applicants || [];
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(a =>
        `${a.first_name} ${a.last_name}`.toLowerCase().includes(s) ||
        a.jobTitle.toLowerCase().includes(s) ||
        (a.source || '').toLowerCase().includes(s)
      );
    }
    if (!sortDesc) items = [...items].reverse();
    return items;
  }, [applicants, search, sortDesc]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getAtsStatus = (a: any) => {
    if (a.tenstreet_sync_status === 'synced' || a.driverreach_sync_status === 'synced') return { label: 'Sent', color: 'text-emerald-400' };
    if (a.tenstreet_sync_status === 'error' || a.driverreach_sync_status === 'error') return { label: 'Error', color: 'text-red-400' };
    if (a.tenstreet_sync_status === 'pending' || a.driverreach_sync_status === 'pending') return { label: 'Pending', color: 'text-amber-400' };
    return { label: '—', color: 'text-muted-foreground' };
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-blue-400" />
              Recent Applicants
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} applicant{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search applicants..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCircle className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">No applicants found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? 'Try adjusting your search.' : 'Applicants will appear here as they apply.'}
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Applicant</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Position</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Source</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium cursor-pointer select-none" onClick={() => setSortDesc(!sortDesc)}>
                      <span className="flex items-center gap-1">Applied <ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                    <th className="text-center py-2 px-3 text-muted-foreground font-medium">Readiness</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Stage</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">ATS</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map(a => {
                    const stage = STAGE_BADGES[(a.status || 'pending').toLowerCase()] || STAGE_BADGES.pending;
                    const sourceColor = SOURCE_COLORS[(a.source || '').toLowerCase()] || 'bg-muted text-muted-foreground';
                    const ats = getAtsStatus(a);
                    return (
                      <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {a.first_name} {a.last_name}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]">{a.jobTitle}</td>
                        <td className="py-2.5 px-3">
                          {a.source && (
                            <span className={`inline-flex text-xs px-2 py-0.5 rounded-full ${sourceColor}`}>
                              {a.source}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs">
                          {a.applied_at ? formatDistanceToNow(new Date(a.applied_at), { addSuffix: true }) : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {a.ats_readiness_score != null ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                              a.ats_readiness_score >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                              a.ats_readiness_score >= 60 ? 'bg-blue-500/20 text-blue-300' :
                              a.ats_readiness_score >= 40 ? 'bg-amber-500/20 text-amber-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {a.ats_readiness_score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${stage.className}`}>
                            {stage.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-xs ${ats.color}`}>{ats.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
