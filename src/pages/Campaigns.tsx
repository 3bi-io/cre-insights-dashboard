
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Eye, Edit, Trash2, Target } from 'lucide-react';
import { logger } from '@/lib/logger';
import { queryKeys } from '@/lib/queryKeys';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  user_id: string;
}

interface JobListing {
  id: string;
  title: string;
  job_title?: string;
  city?: string;
  state?: string;
  client?: string;
  job_id?: string;
  budget: number;
  status: string;
  job_platform_associations?: Array<{
    platforms?: {
      name: string;
    };
  }>;
}

interface CampaignWithStats extends Campaign {
  job_count: number;
  total_budget: number;
  total_spend: number;
}

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showJobsDialog, setShowJobsDialog] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [campaignForm, setCampaignForm] = useState<{
    name: string;
    description: string;
    status: 'active' | 'paused' | 'completed';
  }>({
    name: '',
    description: '',
    status: 'active'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Fetch campaigns with statistics
  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery({
    queryKey: queryKeys.campaigns.all,
    queryFn: async () => {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Get campaign statistics
      const campaignsWithStats = await Promise.all(
        campaignsData.map(async (campaign) => {
          // Get job count for this campaign
          const { count: jobCount } = await supabase
            .from('campaign_job_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);

          // Get jobs assigned to this campaign
          const { data: assignedJobs } = await supabase
            .from('campaign_job_assignments')
            .select(`
              job_listing_id,
              job_listings!inner(budget)
            `)
            .eq('campaign_id', campaign.id);

          // Calculate total budget
          const totalBudget = assignedJobs?.reduce((sum, assignment) => {
            return sum + (assignment.job_listings?.budget || 0);
          }, 0) || 0;

          // Get total spend for jobs in this campaign
          const jobIds = assignedJobs?.map(j => j.job_listing_id) || [];
          let totalSpend = 0;
          
          if (jobIds.length > 0) {
            const { data: spendData } = await supabase
              .from('daily_spend')
              .select('amount')
              .in('job_listing_id', jobIds);
            
            totalSpend = spendData?.reduce((sum, spend) => sum + (spend.amount || 0), 0) || 0;
          }

          return {
            ...campaign,
            job_count: jobCount || 0,
            total_budget: totalBudget,
            total_spend: totalSpend
          };
        })
      );

      return campaignsWithStats as CampaignWithStats[];
    }
  });

  // Fetch job listings for campaign assignment
  const { data: jobListings } = useQuery({
    queryKey: ['job-listings-for-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select(`
          *,
          job_platform_associations(
            platforms(name)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JobListing[];
    }
  });

  // Get jobs already assigned to the selected campaign
  const { data: assignedJobIds } = useQuery({
    queryKey: ['campaign-job-assignments', selectedCampaign?.id],
    queryFn: async () => {
      if (!selectedCampaign?.id) return [];
      
      const { data, error } = await supabase
        .from('campaign_job_assignments')
        .select('job_listing_id')
        .eq('campaign_id', selectedCampaign.id);
      
      if (error) throw error;
      return data.map(assignment => assignment.job_listing_id);
    },
    enabled: !!selectedCampaign?.id
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: typeof campaignForm) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          ...campaignData,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      setShowCreateDialog(false);
      setCampaignForm({ name: '', description: '', status: 'active' });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
    onError: (error) => {
      logger.error('Campaign creation failed', error, { context: 'Campaigns' });
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  });

  // Update campaign job assignments mutation
  const updateJobAssignmentsMutation = useMutation({
    mutationFn: async ({ campaignId, jobIds }: { campaignId: string; jobIds: string[] }) => {
      // First, remove existing assignments
      await supabase
        .from('campaign_job_assignments')
        .delete()
        .eq('campaign_id', campaignId);

      // Then add new assignments
      if (jobIds.length > 0) {
        const assignments = jobIds.map(jobId => ({
          campaign_id: campaignId,
          job_listing_id: jobId
        }));

        const { error } = await supabase
          .from('campaign_job_assignments')
          .insert(assignments);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Campaign jobs updated successfully",
      });
      setShowJobsDialog(false);
      setSelectedJobIds([]);
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({ queryKey: ['campaign-job-assignments'] });
    },
    onError: (error) => {
      logger.error('Campaign job assignment failed', error, { context: 'Campaigns' });
      toast({
        title: "Error",
        description: "Failed to update campaign jobs",
        variant: "destructive",
      });
    }
  });

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }
    
    createCampaignMutation.mutate(campaignForm);
  };

  const handleUpdateJobAssignments = () => {
    if (!selectedCampaign) return;
    
    updateJobAssignmentsMutation.mutate({
      campaignId: selectedCampaign.id,
      jobIds: selectedJobIds
    });
  };

  const handleJobSelection = (jobId: string, checked: boolean) => {
    setSelectedJobIds(prev => 
      checked 
        ? [...prev, jobId]
        : prev.filter(id => id !== jobId)
    );
  };

  // Initialize selected jobs when dialog opens
  React.useEffect(() => {
    if (showJobsDialog && assignedJobIds) {
      setSelectedJobIds(assignedJobIds);
    }
  }, [showJobsDialog, assignedJobIds]);

  const filteredCampaigns = campaigns?.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (campaignsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Organize and manage your job advertising campaigns
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <Label htmlFor="campaignDescription">Description</Label>
                <Textarea
                  id="campaignDescription"
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this campaign"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="campaignStatus">Status</Label>
                <Select 
                  value={campaignForm.status} 
                  onValueChange={(value: 'active' | 'paused' | 'completed') => 
                    setCampaignForm(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateCampaign} 
                  className="flex-1"
                  disabled={createCampaignMutation.isPending}
                >
                  {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Campaigns Grid */}
      {!filteredCampaigns || filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first campaign.'}
            </p>
            {!searchTerm && (
              <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
                Create Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">{campaign.name}</CardTitle>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </div>
                {campaign.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {campaign.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Jobs:</span>
                    <div className="font-medium">{campaign.job_count}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <div className="font-medium">${campaign.total_budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Spent:</span>
                    <div className="font-medium">${campaign.total_spend.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining:</span>
                    <div className="font-medium">${(campaign.total_budget - campaign.total_spend).toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Created {new Date(campaign.created_at).toLocaleDateString()}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowJobsDialog(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Manage Jobs
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Manage Jobs Dialog */}
      <Dialog open={showJobsDialog} onOpenChange={setShowJobsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Jobs in "{selectedCampaign?.name}" Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select which jobs should be included in this campaign. You can group jobs by location, platform, job ID, or other criteria.
            </p>
            
            {/* Job Selection List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {jobListings?.map((job) => (
                <div key={job.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox 
                    id={`job-${job.id}`}
                    checked={selectedJobIds.includes(job.id)}
                    onCheckedChange={(checked) => handleJobSelection(job.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {job.title || job.job_title || 'Untitled Job'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {job.city && job.state && `${job.city}, ${job.state}`}
                      {job.client && ` • ${job.client}`}
                      {job.job_id && ` • ID: ${job.job_id}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Budget: ${job.budget} • Status: {job.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleUpdateJobAssignments}
                disabled={updateJobAssignmentsMutation.isPending}
              >
                {updateJobAssignmentsMutation.isPending ? 'Updating...' : 'Update Campaign'}
              </Button>
              <Button variant="outline" onClick={() => setShowJobsDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Campaigns;
