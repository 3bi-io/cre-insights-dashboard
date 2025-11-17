import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BriefcaseIcon, AlertTriangle, Edit, Trash2, Settings, ExternalLink, Search, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useJobGroups } from '@/features/job-groups/hooks/useJobGroups';
import { JobGroupDialog } from '@/features/job-groups/components/JobGroupDialog';
import { JobAssignmentDialog } from '@/features/job-groups/components/JobAssignmentDialog';
import { JobGroupAIPanel } from '@/features/job-groups/components/JobGroupAIPanel';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const JobGroups = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [jobGroupDialogOpen, setJobGroupDialogOpen] = useState(false);
  const [jobAssignmentDialogOpen, setJobAssignmentDialogOpen] = useState(false);
  const [editingJobGroup, setEditingJobGroup] = useState(null);
  const [assigningJobGroup, setAssigningJobGroup] = useState(null);
  const [currentAssignments, setCurrentAssignments] = useState<string[]>([]);

  // Fetch campaigns for filter
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { 
    jobGroups,
    loading,
    createJobGroup,
    updateJobGroup,
    deleteJobGroup,
    assignJobsToGroup,
    getJobGroupAssignments,
    getXMLFeed,
    isCreating,
    isUpdating,
    isDeleting
  } = useJobGroups({
    enabled: true,
    filters: { 
      search,
      campaignId: selectedCampaign !== 'all' ? selectedCampaign : undefined
    }
  });

  // Handle job group actions
  const handleCreateJobGroup = (data) => {
    createJobGroup(data);
    setJobGroupDialogOpen(false);
    toast({
      title: "Job group created",
      description: "Your job group has been created successfully."
    });
  };

  const handleUpdateJobGroup = (data) => {
    if (editingJobGroup) {
      updateJobGroup(editingJobGroup.id, data);
      setJobGroupDialogOpen(false);
      setEditingJobGroup(null);
      toast({
        title: "Job group updated",
        description: "Your job group has been updated successfully."
      });
    }
  };

  const handleDeleteJobGroup = (jobGroup) => {
    if (confirm(`Are you sure you want to delete "${jobGroup.name}"?`)) {
      deleteJobGroup(jobGroup.id);
      toast({
        title: "Job group deleted",
        description: "Your job group has been deleted successfully."
      });
    }
  };

  const handleAssignJobs = async (jobListingIds: string[]) => {
    if (assigningJobGroup) {
      await assignJobsToGroup(assigningJobGroup.id, jobListingIds);
      setJobAssignmentDialogOpen(false);
      setAssigningJobGroup(null);
      toast({
        title: "Jobs assigned",
        description: "Jobs have been assigned to the job group successfully."
      });
    }
  };

  const handleOpenAssignments = async (jobGroup) => {
    setAssigningJobGroup(jobGroup);
    
    // Fetch current assignments
    const result = await getJobGroupAssignments(jobGroup.id);
    if (result.data) {
      setCurrentAssignments(result.data.map(assignment => assignment.job_listing_id));
    }
    
    setJobAssignmentDialogOpen(true);
  };

  const handleGetXMLFeed = async (jobGroup) => {
    const result = await getXMLFeed(jobGroup.id);
    if (result.data) {
      // Open XML feed in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`<pre>${result.data.xml}</pre>`);
        newWindow.document.title = `XML Feed - ${jobGroup.name}`;
      }
      
      toast({
        title: "XML Feed Generated",
        description: "The XML feed has been opened in a new window."
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800'; 
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user has proper permissions
  if (userRole !== 'super_admin' && userRole !== 'admin') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You need admin or super admin permissions to access job groups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Groups</h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage job listings in groups for campaign targeting and XML feeds
            {userRole === 'super_admin' && (
              <span className="ml-2 text-primary font-medium">(Super Administrator View)</span>
            )}
          </p>
        </div>
        <Button onClick={() => setJobGroupDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job Group
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search job groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AI Panel - Show when campaign is selected */}
      {selectedCampaign && selectedCampaign !== 'all' && (
        <div className="mb-6">
          <JobGroupAIPanel
            campaignId={selectedCampaign}
            campaignName={campaigns.find(c => c.id === selectedCampaign)?.name || 'Campaign'}
            organizationId={undefined}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !jobGroups || jobGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No job groups found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first job group to organize job listings for targeted campaigns and XML feeds.
            </p>
            <Button onClick={() => setJobGroupDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Job Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobGroups.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {jobGroups.filter(group => group.status === 'active').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Publishers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(jobGroups.map(group => group.publisher_name)).size}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Paused Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {jobGroups.filter(group => group.status === 'paused').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobGroups.map((jobGroup) => (
              <Card key={jobGroup.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold mb-1">
                        {jobGroup.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {jobGroup.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(jobGroup.status || 'active')}
                    >
                      {jobGroup.status || 'active'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Publisher:</span>
                      <span className="font-medium">{jobGroup.publisher_name}</span>
                    </div>
                    
                    {jobGroup.publisher_endpoint && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Endpoint:</span>
                        <span className="font-mono text-xs truncate max-w-[120px]">
                          {jobGroup.publisher_endpoint}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingJobGroup(jobGroup);
                        setJobGroupDialogOpen(true);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenAssignments(jobGroup)}
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      Jobs
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGetXMLFeed(jobGroup)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      XML
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteJobGroup(jobGroup)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started with Job Groups</CardTitle>
          <CardDescription>How to create and manage job groups for publisher feeds</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
            <li>Create a job group by clicking "Create Job Group" and specify the target publisher</li>
            <li>Assign specific job listings to the group using the "Jobs" button</li>
            <li>Configure publisher-specific settings and endpoint URLs</li>
            <li>Generate XML feeds for the job group to send to publishers</li>
            <li>Monitor job group status and manage assignments as needed</li>
            <li>Use different job groups for different publishers or campaign strategies</li>
          </ol>
          <Alert className="mt-4">
            <BriefcaseIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Job groups enable you to create targeted XML feeds for specific 
              publishers while organizing related positions within your campaigns.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <JobGroupDialog
        open={jobGroupDialogOpen}
        onOpenChange={setJobGroupDialogOpen}
        onSubmit={editingJobGroup ? handleUpdateJobGroup : handleCreateJobGroup}
        jobGroup={editingJobGroup}
        campaignId={selectedCampaign !== 'all' ? selectedCampaign : campaigns[0]?.id || ''}
        isLoading={isCreating || isUpdating}
      />

      {assigningJobGroup && (
        <JobAssignmentDialog
          open={jobAssignmentDialogOpen}
          onOpenChange={setJobAssignmentDialogOpen}
          jobGroup={assigningJobGroup}
          onAssignJobs={handleAssignJobs}
          currentAssignments={currentAssignments}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default JobGroups;