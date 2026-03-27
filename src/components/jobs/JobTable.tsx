
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, MoreHorizontal, MapPin, Eye, Edit, Trash2, ChevronUp, ChevronDown, DollarSign, Mic, Link2, Sparkles, Calendar, Activity, Globe } from 'lucide-react';
import { CopyApplyLinkButton } from './CopyApplyLinkButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { GeoExpandDialog } from '@/components/admin/GeoExpandDialog';

interface JobTableProps {
  jobs: any[] | undefined;
  onViewAnalytics: (job: any) => void;
  onShowUploadDialog: () => void;
  onVoiceApply?: (job: any) => void;
  onRefresh?: () => void;
}

type SortField = 'title' | 'job_id' | 'platform' | 'category' | 'location' | 'status' | 'created_at' | 'salary' | 'is_sponsored';
type SortDirection = 'asc' | 'desc';

const JobTable: React.FC<JobTableProps> = ({ 
  jobs, 
  onViewAnalytics, 
  onShowUploadDialog,
  onVoiceApply,
  onRefresh
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [updatingSponsorship, setUpdatingSponsorship] = useState<string | null>(null);
  const [geoExpandJobId, setGeoExpandJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const { userRole } = useAuth();

  const handleSponsorshipToggle = async (jobId: string, currentValue: boolean) => {
    setUpdatingSponsorship(jobId);
    try {
      const { error } = await supabase
        .from('job_listings')
        .update({ is_sponsored: !currentValue })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: !currentValue ? 'Job marked as sponsored' : 'Job marked as organic',
        description: !currentValue 
          ? 'This job will be highlighted in listings'
          : 'Sponsorship removed from this job',
      });
      
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Error updating sponsorship',
        description: error instanceof Error ? error.message : 'Failed to update',
        variant: 'destructive',
      });
    } finally {
      setUpdatingSponsorship(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'paused':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      case 'expired':
      case 'completed':
        return 'bg-red-500/15 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/20';
    }
  };

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return 'Not specified';
    
    const formatAmount = (amount: number) => {
      if (type === 'hourly') return `$${amount}/hr`;
      if (type === 'yearly') return `$${amount.toLocaleString()}/yr`;
      return `$${amount.toLocaleString()}`;
    };

    if (min && max) {
      return `${formatAmount(min)} - ${formatAmount(max)}`;
    }
    return formatAmount(min || max || 0);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 ml-1" /> : 
      <ChevronDown className="w-4 h-4 ml-1" />;
  };

  const sortedJobs = jobs ? [...jobs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = (a.title || a.job_title || '').toLowerCase();
        bValue = (b.title || b.job_title || '').toLowerCase();
        break;
      case 'job_id':
        aValue = a.job_id || '';
        bValue = b.job_id || '';
        break;
      case 'platform':
        aValue = a.job_platform_associations?.[0]?.platforms?.name?.toLowerCase() || '';
        bValue = b.job_platform_associations?.[0]?.platforms?.name?.toLowerCase() || '';
        break;
      case 'category':
        aValue = a.job_categories?.name?.toLowerCase() || '';
        bValue = b.job_categories?.name?.toLowerCase() || '';
        break;
      case 'location':
        aValue = (a.location || (a.city && a.state ? `${a.city}, ${a.state}` : '')).toLowerCase();
        bValue = (b.location || (b.city && b.state ? `${b.city}, ${b.state}` : '')).toLowerCase();
        break;
      case 'status':
        aValue = (a.status || 'active').toLowerCase();
        bValue = (b.status || 'active').toLowerCase();
        break;
      case 'salary':
        aValue = a.salary_min || a.salary_max || 0;
        bValue = b.salary_min || b.salary_max || 0;
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'is_sponsored':
        aValue = a.is_sponsored ? 1 : 0;
        bValue = b.is_sponsored ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  if (!jobs || jobs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 px-4">
          <div className="text-muted-foreground mb-4">
            <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No job listings found</h3>
            <p className="text-sm sm:text-base">Get started by uploading a CSV file with your job listings.</p>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={onShowUploadDialog} className="w-full sm:w-auto">
              Upload CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('title')}
                  >
                    Job Title
                    {getSortIcon('title')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('job_id')}
                  >
                    Job ID
                    {getSortIcon('job_id')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('platform')}
                  >
                    Platform
                    {getSortIcon('platform')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('category')}
                  >
                    Category
                    {getSortIcon('category')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('location')}
                  >
                    Location
                    {getSortIcon('location')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('salary')}
                  >
                    Salary
                    {getSortIcon('salary')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {getSortIcon('status')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('created_at')}
                  >
                    Created
                    {getSortIcon('created_at')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="h-auto p-0 font-medium hover:bg-transparent flex items-center"
                    onClick={() => handleSort('is_sponsored')}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Sponsored
                    {getSortIcon('is_sponsored')}
                  </Button>
                </TableHead>
                <TableHead>Feed Data</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.map((job) => {
                const displayTitle = job.title || job.job_title || 'Untitled Job';
                const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : 'Not specified');
                const displayDescription = job.description || job.job_description;
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
                
                return (
                  <TableRow key={job.id} className="hover:bg-muted/40 even:bg-muted/10">
                    <TableCell className="font-medium">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{displayTitle}</div>
                        {(job.clients?.name || job.client) && (
                          <div className="text-sm text-muted-foreground truncate">
                            {job.clients?.name || job.client}
                          </div>
                        )}
                        {displayDescription && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2 max-w-[200px]">
                            {displayDescription}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground font-mono text-xs cursor-help">
                              {job.job_id ? `${job.job_id.slice(0, 8)}…` : 'N/A'}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-mono text-xs">{job.job_id || 'No ID'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {job.job_platform_associations?.map((assoc, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {assoc.platforms?.name || 'Unknown'}
                          </Badge>
                        )) || <span className="text-muted-foreground">No publishers</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {job.job_categories?.name || 'Uncategorized'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">{displayLocation}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate text-sm">{salary}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(job.status || 'active')}>
                        {(job.status || 'active').charAt(0).toUpperCase() + (job.status || 'active').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={job.is_sponsored || false}
                          onCheckedChange={() => handleSponsorshipToggle(job.id, job.is_sponsored || false)}
                          disabled={updatingSponsorship === job.id}
                          className="data-[state=checked]:bg-amber-500"
                        />
                        {job.is_sponsored && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                        {job.jobreferrer && (
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]" title={job.jobreferrer}>
                            {job.jobreferrer}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center gap-1">
                          {job.feed_date && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded bg-green-100 dark:bg-green-950/30">
                                  <Calendar className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Feed Date: {new Date(job.feed_date).toLocaleDateString()}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {job.indeed_apply_job_id && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-none">I</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Indeed Apply Enabled</p>
                                <p className="text-xs text-muted-foreground">Job ID: {job.indeed_apply_job_id}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {job.tracking_pixel_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1 rounded bg-purple-100 dark:bg-purple-950/30">
                                  <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tracking Pixel Active</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {!job.feed_date && !job.indeed_apply_job_id && !job.tracking_pixel_url && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CopyApplyLinkButton 
                          jobId={job.id} 
                          jobTitle={job.title || job.job_title}
                          organizationId={job.organization_id}
                        />
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewAnalytics(job)}
                          className="hidden sm:flex"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        {onVoiceApply && (
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => onVoiceApply(job)}
                            className="hidden lg:flex"
                          >
                            <Mic className="w-4 h-4 mr-1" />
                            Voice Apply
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                            <DropdownMenuItem onClick={() => onViewAnalytics(job)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {onVoiceApply && (
                              <DropdownMenuItem onClick={() => onVoiceApply(job)}>
                                <Mic className="w-4 h-4 mr-2" />
                                Apply with Voice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Job
                            </DropdownMenuItem>
                            {userRole === 'super_admin' && (
                              <DropdownMenuItem onClick={() => setGeoExpandJobId(job.id)}>
                                <Globe className="w-4 h-4 mr-2" />
                                Geo Expand
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {geoExpandJobId && (
        <GeoExpandDialog
          open={!!geoExpandJobId}
          onOpenChange={(open) => { if (!open) setGeoExpandJobId(null); }}
          jobIds={[geoExpandJobId]}
          onSuccess={() => onRefresh?.()}
        />
      )}
    </Card>
  );
};

export default JobTable;
