
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, MapPin, Eye, Edit, Trash2 } from 'lucide-react';

interface JobCardProps {
  job: any;
  onViewAnalytics: (job: any) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onViewAnalytics }) => {
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

  const getJobIdFromLocation = (location: string) => {
    const locationJobIdMap: { [key: string]: number } = {
      'Joliet, IL': 371,
      'Ridgefield, OR': 338,
      'Cowpens, SC': 590,
      'Warrensburg, MO': 361,
      'Memphis, TN': 882,
      'Oklahoma City, OK': 141,
      'St George, UT': 328,
      'Denver, CO': 911
    };
    
    return locationJobIdMap[location] || null;
  };

  const jobId = job.job_id || getJobIdFromLocation(job.location);

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight break-words">{job.title}</CardTitle>
            <div className="text-sm text-gray-600 mt-1 space-y-1">
              <p className="break-words">
                {job.platforms?.name === 'Indeed' ? 'X' : job.platforms?.name} • {job.job_categories?.name}
              </p>
              {jobId && (
                <p className="font-mono text-xs text-muted-foreground">
                  ID: {jobId}
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
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
          {job.clients?.name && (
            <span className="text-sm font-medium text-primary">
              {job.clients.name}
            </span>
          )}
        </div>
        
        {job.location && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="break-words">{job.location}</span>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 mt-auto">
          <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="pt-2 mt-auto">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewAnalytics(job)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
