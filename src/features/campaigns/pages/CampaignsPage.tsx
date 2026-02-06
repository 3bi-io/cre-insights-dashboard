import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Target,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { PageLayout } from '@/features/shared';
import { useCampaigns } from '../hooks/useCampaigns';
import { CreateCampaignDialog, CampaignCard, CampaignMappingManager } from '../components';
import { Database } from '@/integrations/supabase/types';
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog';

type Campaign = Database['public']['Tables']['campaigns']['Row'];

const CampaignsPage = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  
  const {
    campaigns,
    stats,
    isLoading,
    isError,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    isCreating,
  } = useCampaigns();

  const handleCreateCampaign = (campaignData: {
    name: string;
    description?: string;
    status: string;
  }) => {
    createCampaign(campaignData, {
      onSuccess: () => {
        setShowCreateDialog(false);
      },
    });
  };

  const handleToggleStatus = (campaign: Campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    updateCampaign({
      id: campaign.id,
      updates: { status: newStatus },
    });
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      deleteCampaign(campaignToDelete.id);
    }
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  // Filter campaigns based on search term
  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) return campaigns;
    
    const search = searchTerm.toLowerCase();
    return campaigns.filter(
      (campaign) =>
        campaign.name.toLowerCase().includes(search) ||
        campaign.description?.toLowerCase().includes(search)
    );
  }, [campaigns, searchTerm]);

  const pageActions = (
    <Button
      className="flex items-center gap-2"
      onClick={() => setShowCreateDialog(true)}
    >
      <Plus className="w-4 h-4" />
      Create Campaign
    </Button>
  );

  return (
    <PageLayout 
      title="Campaigns" 
      description="Manage and monitor your advertising campaigns"
      actions={pageActions}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="mappings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sponsorship Mappings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.totalCampaigns || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        All time campaigns
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.activeCampaigns || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        Currently running
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        From all campaigns
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Cost per Lead</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold">
                        ${stats?.avgCostPerLead ? stats.avgCostPerLead.toFixed(2) : '0.00'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average across campaigns
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Error State */}
            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load campaigns. Please try again later.
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Campaigns List */}
            {!isLoading && !isError && (
              <>
                <div className="space-y-4">
                  {filteredCampaigns.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          {searchTerm ? 'No campaigns found' : 'No campaigns yet'}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {searchTerm
                            ? 'Try adjusting your search terms'
                            : 'Create your first campaign to get started'}
                        </p>
                        {!searchTerm && (
                          <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteClick}
                      />
                    ))
                  )}
                </div>

                <ConfirmationDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                  title="Delete Campaign"
                  description={`Are you sure you want to delete "${campaignToDelete?.name}"?`}
                  confirmLabel="Delete"
                  variant="destructive"
                  onConfirm={handleConfirmDelete}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="mappings">
            <CampaignMappingManager />
          </TabsContent>
        </Tabs>
      </div>

      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateCampaign}
        isCreating={isCreating}
      />
    </PageLayout>
  );
};

export default CampaignsPage;