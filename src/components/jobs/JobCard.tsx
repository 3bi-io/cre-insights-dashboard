import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

interface JobCardProps {
  job: any;
  onEditJob: (job: any) => void;
  onViewAnalytics: (job: any) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onEditJob, onViewAnalytics }) => {
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{job.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {job.platforms?.name} • {job.job_categories?.name}
            </p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
        
        {job.location && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            📍 {job.location}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
          <span className="capitalize">{job.experience_level}</span>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEditJob(job)}
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewAnalytics(job)}
          >
            View Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;