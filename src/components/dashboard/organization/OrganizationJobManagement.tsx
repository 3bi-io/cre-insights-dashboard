import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  BriefcaseIcon, 
  Users, 
  Eye,
  Edit,
  MoreHorizontal,
  MapPin,
  DollarSign
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOrganizationJobData } from '@/hooks/useOrganizationJobData';

export const OrganizationJobManagement = () => {
  const { data: jobData, isLoading } = useOrganizationJobData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Job Management</h3>
          <Button disabled>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Job Management</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BriefcaseIcon className="w-4 h-4" />
              Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobData?.activeJobs || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobData?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">All time applications</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Average Salary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobData?.averageSalary ? `$${Math.round(jobData.averageSalary / 1000)}K` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Across all positions</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Job Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {!jobData?.recentJobs?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active job listings found</p>
              <Button className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobData.recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{job.title}</h4>
                      <Badge variant={job.status === 'active' ? 'secondary' : 'outline'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      {job.salary_min && job.salary_max && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {job.application_count} applications
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Duplicate Job</DropdownMenuItem>
                        <DropdownMenuItem>Export Applications</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive Job</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};