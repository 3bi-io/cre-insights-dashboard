import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, LayoutGrid, List, Download, ChevronDown, User, Calendar,
  CheckCircle2, Send, GripVertical, Eye, ArrowRight,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { STAGES, getSourceStyle, getStageConfig } from './stageConfig';
import type { ClientApplication } from '../../hooks/useClientApplications';

type ViewMode = 'kanban' | 'list';

interface ClientApplicantsTabProps {
  applications: ClientApplication[];
  onApplicationClick: (app: ClientApplication) => void;
  onStageChange: (applicationId: string, newStage: string) => void;
}

const ClientApplicantsTab: React.FC<ClientApplicantsTabProps> = ({
  applications,
  onApplicationClick,
  onStageChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('client-ats-view') as ViewMode) || 'kanban';
  });
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('client-ats-view', mode);
  };

  const filtered = useMemo(() => {
    let result = applications;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.first_name?.toLowerCase().includes(q) ||
        a.last_name?.toLowerCase().includes(q) ||
        a.applicant_email?.toLowerCase().includes(q) ||
        a.phone?.includes(q)
      );
    }
    if (stageFilter !== 'all') {
      result = result.filter(a => (a.status || 'pending') === stageFilter);
    }
    if (sourceFilter !== 'all') {
      result = result.filter(a => a.source?.toLowerCase() === sourceFilter.toLowerCase());
    }
    return result;
  }, [applications, search, stageFilter, sourceFilter]);

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    applications.forEach(a => { if (a.source) sources.add(a.source); });
    return Array.from(sources);
  }, [applications]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Phone', 'Job', 'Stage', 'Source', 'Applied', 'Readiness Score'];
    const rows = filtered.map(a => [
      `${a.first_name || ''} ${a.last_name || ''}`.trim(),
      a.applicant_email || '',
      a.phone || '',
      a.job_listings?.title || a.job_listings?.job_title || '',
      a.status || 'pending',
      a.source || '',
      a.applied_at || '',
      String(a.ats_readiness_score ?? ''),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Paginated data for list view
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedApps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Grouped for kanban
  const groupedByStage = useMemo(() => {
    const map: Record<string, ClientApplication[]> = {};
    STAGES.forEach(s => { map[s.id] = []; });
    filtered.forEach(a => {
      const stage = a.status || 'pending';
      if (map[stage]) map[stage].push(a);
      else if (map['pending']) map['pending'].push(a);
    });
    return map;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {uniqueSources.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          {selectedIds.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  Bulk Actions ({selectedIds.size})
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {STAGES.map(s => (
                  <DropdownMenuItem key={s.id} onClick={() => {
                    selectedIds.forEach(id => onStageChange(id, s.id));
                    setSelectedIds(new Set());
                  }}>
                    Move to {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>

          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => handleViewChange('kanban')}
              className={cn('p-1.5 transition-colors', viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleViewChange('list')}
              className={cn('p-1.5 transition-colors', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Badge variant="secondary" className="ml-1">{filtered.length} applicants</Badge>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-4 min-w-max">
            {STAGES.map(stage => (
              <div key={stage.id} className="w-64 min-w-64 flex flex-col bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between p-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', stage.color)} />
                    <span className="text-sm font-semibold">{stage.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{groupedByStage[stage.id]?.length || 0}</Badge>
                </div>
                <ScrollArea className="flex-1 max-h-[calc(100vh-340px)]">
                  <div className="p-2 space-y-2 min-h-[80px]">
                    {(groupedByStage[stage.id] || []).length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-6">No applicants</div>
                    ) : (
                      (groupedByStage[stage.id] || []).map(app => (
                        <KanbanAppCard key={app.id} app={app} onClick={() => onApplicationClick(app)} />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 w-8">
                    <Checkbox
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Job Title</th>
                  <th className="p-3 text-left font-medium">Stage</th>
                  <th className="p-3 text-left font-medium">Source</th>
                  <th className="p-3 text-left font-medium">Applied</th>
                  <th className="p-3 text-left font-medium">Score</th>
                  <th className="p-3 text-left font-medium">ATS</th>
                  <th className="p-3 text-left font-medium">Recruiter</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map(app => {
                  const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || 'Unknown';
                  const jobTitle = app.job_listings?.title || app.job_listings?.job_title || '—';
                  const stageConf = getStageConfig(app.status || 'pending');
                  const srcStyle = getSourceStyle(app.source);
                  const ats = app.tenstreet_sync_status || app.driverreach_sync_status;
                  const recruiter = app.recruiters ? `${app.recruiters.first_name} ${app.recruiters.last_name}` : '—';

                  return (
                    <tr key={app.id} className="border-b hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => onApplicationClick(app)}>
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(app.id)} onCheckedChange={() => toggleSelect(app.id)} />
                      </td>
                      <td className="p-3 font-medium">{name}</td>
                      <td className="p-3 text-muted-foreground">{jobTitle}</td>
                      <td className="p-3">
                        <Select value={app.status || 'pending'} onValueChange={v => { onStageChange(app.id, v); }}>
                          <SelectTrigger className="h-7 w-28 text-xs" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <div className={cn('w-2 h-2 rounded-full', stageConf.color)} />
                              {stageConf.label}
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map(s => (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center gap-1.5">
                                  <div className={cn('w-2 h-2 rounded-full', s.color)} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={cn('text-xs', srcStyle.bg, srcStyle.text)}>
                          {app.source || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {app.applied_at ? formatDistanceToNow(new Date(app.applied_at), { addSuffix: true }) : '—'}
                      </td>
                      <td className="p-3">
                        {app.ats_readiness_score != null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className={cn(
                                'h-full rounded-full',
                                app.ats_readiness_score >= 70 ? 'bg-emerald-500' : app.ats_readiness_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                              )} style={{ width: `${app.ats_readiness_score}%` }} />
                            </div>
                            <span className="text-xs">{app.ats_readiness_score}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="p-3">
                        {ats === 'synced' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : ats === 'error' ? (
                          <span className="text-red-500 text-xs">Error</span>
                        ) : (
                          <Send className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{recruiter}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={e => { e.stopPropagation(); onApplicationClick(app); }}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Show</span>
                <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-16 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>of {filtered.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  Prev
                </Button>
                <span className="text-sm px-2">{currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

// Kanban card sub-component
const KanbanAppCard: React.FC<{ app: ClientApplication; onClick: () => void }> = ({ app, onClick }) => {
  const name = [app.first_name, app.last_name].filter(Boolean).join(' ') || 'Unknown';
  const jobTitle = app.job_listings?.title || app.job_listings?.job_title || 'No position';
  const srcStyle = getSourceStyle(app.source);
  const score = app.ats_readiness_score;
  const ats = app.tenstreet_sync_status || app.driverreach_sync_status;

  return (
    <Card className="p-3 cursor-pointer hover:shadow-md transition-all group" onClick={onClick}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">{name}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {app.source && (
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-4', srcStyle.bg, srcStyle.text)}>
              {app.source}
            </Badge>
          )}
          {score != null && (
            <div className="flex items-center gap-1">
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold',
                score >= 70 ? 'border-emerald-500 text-emerald-500' : score >= 40 ? 'border-amber-500 text-amber-500' : 'border-red-500 text-red-500'
              )}>
                {score}
              </div>
            </div>
          )}
          {ats === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          {ats === 'error' && <span className="text-[10px] text-red-500">⚠</span>}
        </div>
        <div className="flex items-center justify-between">
          {app.applied_at && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ClientApplicantsTab;
