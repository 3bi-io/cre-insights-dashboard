import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MapPin, Eye, Edit, Trash2, DollarSign, Clock, MoreHorizontal, Building } from 'lucide-react';

interface JobGridProps {
  jobs: any[] | undefined;
  onViewAnalytics: (job: any) => void;
  onShowUploadDialog: () => void;
}

const JobGrid: React.FC<JobGridProps> = ({ 
  jobs, 
  onViewAnalytics, 
  onShowUploadDialog 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const formatSalary = (min: number | null, max: number | null, type: string | null) => {
    if (!min && !max) return null;
    
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

  if (!jobs || jobs.length === 0) {
    return (
      <Card className="border-dashed border-2">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {jobs.map((job) => {
        const displayTitle = job.title || job.job_title || 'Untitled Job';
        const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : null);
        const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
        const displayDescription = job.description || job.job_description;

        return (
          <Card key={job.id} className="hover:shadow-lg transition-all duration-200 h-full flex flex-col group border-border/50 hover:border-border">
            <CardHeader className="pb-3 flex-shrink-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight break-words line-clamp-2 group-hover:text-primary transition-colors">
                    {displayTitle}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3" />
                      <span className="break-words">
                        {job.job_platform_associations?.map(assoc => assoc.platforms?.name).join(', ') || 'No platforms'}
                      </span>
                    </div>
                    {job.job_id && (
                      <p className="font-mono text-xs text-muted-foreground/70">
                        ID: {job.job_id}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewAnalytics(job)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Job
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Job
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={getStatusColor(job.status || 'active')}>
                  {job.status || 'active'}
                </Badge>
                {(job.clients?.name || job.client) && (
                  <span className="text-sm font-medium text-primary">
                    {job.clients?.name || job.client}
                  </span>
                )}
              </div>

              {displayDescription && (
                <div className="text-sm text-muted-foreground break-words">
                  <p className="line-clamp-3">{displayDescription}</p>
                </div>
              )}
              
              {displayLocation && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{displayLocation}</span>
                </div>
              )}

              {salary && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{salary}</span>
                </div>
              )}

              {job.dest_city && job.dest_state && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Destination:</span> {job.dest_city}, {job.dest_state}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground/70 mt-auto pt-2 border-t border-border/30">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(job.created_at).toLocaleDateString()}
                </span>
                {job.job_categories?.name && (
                  <Badge variant="secondary" className="text-xs">
                    {job.job_categories.name}
                  </Badge>
                )}
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onViewAnalytics(job)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default JobGrid;