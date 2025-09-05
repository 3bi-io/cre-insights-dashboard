
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, MapPin, Eye, Edit, Trash2, DollarSign, Clock, Mic } from 'lucide-react';

interface JobCardProps {
  job: any;
  onViewAnalytics: (job: any) => void;
  onVoiceApply?: (job: any) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onViewAnalytics, onVoiceApply }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const displayTitle = job.title || job.job_title || 'Untitled Job';
  const displayLocation = job.location || (job.city && job.state ? `${job.city}, ${job.state}` : null);
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_type);
  const displayDescription = job.description || job.job_description;

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight break-words">{displayTitle}</CardTitle>
            <div className="text-sm text-gray-600 mt-1 space-y-1">
              <p className="break-words">
                {job.job_platform_associations?.map(assoc => assoc.platforms?.name).join(', ') || 'No platforms'} • {job.job_categories?.name}
              </p>
              {job.job_id && (
                <p className="font-mono text-xs text-muted-foreground">
                  ID: {job.job_id}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 w-8 p-0">
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
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(job.status || 'active')}>
            {job.status || 'active'}
          </Badge>
          {(job.clients?.name || job.client) && (
            <span className="text-sm font-medium text-primary">
              {job.clients?.name || job.client}
            </span>
          )}
        </div>

        {displayDescription && (
          <div className="text-sm text-gray-600 break-words">
            <p className="line-clamp-3">{displayDescription}</p>
          </div>
        )}
        
        {displayLocation && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{displayLocation}</span>
          </div>
        )}

        {salary && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span>{salary}</span>
          </div>
        )}

        {job.dest_city && job.dest_state && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Destination:</span> {job.dest_city}, {job.dest_state}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 mt-auto">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Created {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
        
        <div className="pt-2 mt-auto space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewAnalytics(job)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          {onVoiceApply && (
            <Button 
              variant="default"
              size="sm" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => onVoiceApply(job)}
            >
              <Mic className="w-4 h-4 mr-2" />
              Apply with Voice
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
