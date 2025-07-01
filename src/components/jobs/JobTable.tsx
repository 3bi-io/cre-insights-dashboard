
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, MapPin, Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface JobTableProps {
  jobs: any[] | undefined;
  onViewAnalytics: (job: any) => void;
  onShowUploadDialog: () => void;
}

type SortField = 'title' | 'job_id' | 'platform' | 'category' | 'location' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

const JobTable: React.FC<JobTableProps> = ({ 
  jobs, 
  onViewAnalytics, 
  onShowUploadDialog 
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
        aValue = a.title?.toLowerCase() || '';
        bValue = b.title?.toLowerCase() || '';
        break;
      case 'job_id':
        aValue = a.job_id || getJobIdFromLocation(a.location) || 0;
        bValue = b.job_id || getJobIdFromLocation(b.location) || 0;
        break;
      case 'platform':
        aValue = a.platforms?.name?.toLowerCase() || '';
        bValue = b.platforms?.name?.toLowerCase() || '';
        break;
      case 'category':
        aValue = a.job_categories?.name?.toLowerCase() || '';
        bValue = b.job_categories?.name?.toLowerCase() || '';
        break;
      case 'location':
        aValue = a.location?.toLowerCase() || '';
        bValue = b.location?.toLowerCase() || '';
        break;
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
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
          <div className="text-gray-500 mb-4">
            <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs.map((job) => {
                const jobId = job.job_id || getJobIdFromLocation(job.location);
                
                return (
                  <TableRow key={job.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{job.title}</div>
                        {job.client && (
                          <div className="text-sm text-muted-foreground truncate">{job.client}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground font-mono text-sm">
                        {jobId || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {job.platforms?.name === 'Indeed' ? 'X' : job.platforms?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">{job.job_categories?.name}</span>
                    </TableCell>
                    <TableCell>
                      {job.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{job.location}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewAnalytics(job)}
                          className="hidden sm:flex"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobTable;
