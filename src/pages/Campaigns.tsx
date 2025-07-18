
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Plus, Search, MapPin, Users, Eye, Edit, Trash2, Target } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  job_count: number;
  total_budget: number;
  total_spend: number;
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

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showJobsDialog, setShowJobsDialog] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    description: '',
    status: 'active' as const
  });
  const { toast } = useToast();

  // Fetch campaigns (mock data for now)
  const { data: campaigns, isLoading: campaignsLoading, refetch: refetchCampaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      // Mock data - in real implementation, this would fetch from campaigns table
      return [
        {
          id: '1',
          name: 'Denver Metro Drivers',
          description: 'CDL-A drivers for Denver metropolitan area',
          status: 'active' as const,
          created_at: '2025-01-15T10:00:00Z',
          job_count: 12,
          total_budget: 5000,
          total_spend: 3200
        },
        {
          id: '2',
          name: 'Texas Regional Campaign',
          description: 'Regional drivers across Texas markets',
          status: 'active' as const,
          created_at: '2025-01-10T09:00:00Z',
          job_count: 8,
          total_budget: 8000,
          total_spend: 4500
        }
      ] as Campaign[];
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

  const handleCreateCampaign = async () => {
    try {
      // Mock implementation - in real app, this would save to campaigns table
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      setShowCreateDialog(false);
      setCampaignForm({ name: '', description: '', status: 'active' });
      refetchCampaigns();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

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
                <Button onClick={handleCreateCampaign} className="flex-1">
                  Create Campaign
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
                    View Jobs
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

      {/* View Jobs Dialog */}
      <Dialog open={showJobsDialog} onOpenChange={setShowJobsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Jobs in "{selectedCampaign?.name}" Campaign
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage which jobs are included in this campaign. You can group jobs by location, platform, job ID, or other criteria.
            </p>
            
            {/* Job Selection List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {jobListings?.slice(0, 10).map((job) => (
                <div key={job.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox id={`job-${job.id}`} />
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
              <Button className="flex-1">
                Update Campaign
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
