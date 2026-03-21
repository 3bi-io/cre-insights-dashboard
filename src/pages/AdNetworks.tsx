import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePlatforms } from '@/hooks/usePlatforms';
import PlatformsTable from '@/components/platforms/PlatformsTable';
import AddPlatformDialog from '@/components/platforms/AddPlatformDialog';
import PlatformActionPanel from '@/components/platforms/PlatformActionPanel';
import PlatformCredentialsOverview from '@/components/platforms/PlatformCredentialsOverview';
import { PlatformAccessGuard } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, TrendingUp, Plus, DollarSign, Rss, Truck, Key, Settings } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { TenstreetNavigationCard } from '@/components/admin/TenstreetNavigationCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdNetworks = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const {
    platforms,
    isLoading,
    refetch
  } = usePlatforms();

  const handleAddSuccess = () => {
    setShowAddDialog(false);
    refetch();
    toast({
      title: "Success",
      description: "Ad network added successfully",
    });
  };

  const [selectedPaidPlatform, setSelectedPaidPlatform] = useState('meta');
  const [selectedFreePlatform, setSelectedFreePlatform] = useState('google jobs');
  const [selectedTruckingPlatform, setSelectedTruckingPlatform] = useState('truck driver jobs 411');

  const xPlatformConfigured = platforms?.some(p => 
    (p.name.toLowerCase().includes('x') || p.name.toLowerCase().includes('twitter')) && p.api_endpoint
  );

  const paidPlatforms = [
    { value: 'meta', label: 'Meta (Facebook/Instagram)' },
    { value: 'indeed', label: 'Indeed' },
    { value: 'google jobs', label: 'Google Jobs' },
    { value: 'x', label: 'X (Twitter)' },
    { value: 'ziprecruiter', label: 'ZipRecruiter' },
    { value: 'talroo', label: 'Talroo' },
    { value: 'adzuna', label: 'Adzuna' },
  ];

  const freePlatforms = [
    { value: 'google jobs', label: 'Google Jobs' },
    { value: 'craigslist', label: 'Craigslist' },
    { value: 'simplyhired', label: 'SimplyHired' },
    { value: 'glassdoor', label: 'Glassdoor' },
  ];

  const truckingPlatforms = [
    { value: 'truck driver jobs 411', label: 'Truck Driver Jobs 411' },
  ];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4 min-w-[200px]"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout 
      title="Ad Networks" 
      description="Manage paid advertising platforms for job distribution"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Summary badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {platforms?.filter(p => p.api_endpoint).length || 0} Active
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            {platforms?.length || 0} Total Networks
          </Badge>
          {xPlatformConfigured && (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1.5">
              <Zap className="w-3 h-3" />
              X API Active
            </Badge>
          )}
          <div className="ml-auto">
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Network</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Paid</span>
            </TabsTrigger>
            <TabsTrigger value="free" className="flex items-center gap-2">
              <Rss className="w-4 h-4" />
              <span className="hidden sm:inline">Free</span>
            </TabsTrigger>
            <TabsTrigger value="trucking" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Trucking</span>
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Credentials</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">ATS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <PlatformsTable
              platforms={platforms}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="paid" className="space-y-6 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Select Platform:</span>
              <Select value={selectedPaidPlatform} onValueChange={setSelectedPaidPlatform}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Choose a platform" />
                </SelectTrigger>
                <SelectContent>
                  {paidPlatforms.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PlatformActionPanel platformName={selectedPaidPlatform} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="free" className="space-y-6 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Select Platform:</span>
              <Select value={selectedFreePlatform} onValueChange={setSelectedFreePlatform}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Choose a platform" />
                </SelectTrigger>
                <SelectContent>
                  {freePlatforms.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PlatformActionPanel platformName={selectedFreePlatform} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="trucking" className="space-y-6 mt-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-medium">Select Platform:</span>
              <Select value={selectedTruckingPlatform} onValueChange={setSelectedTruckingPlatform}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Choose a platform" />
                </SelectTrigger>
                <SelectContent>
                  {truckingPlatforms.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <PlatformActionPanel platformName={selectedTruckingPlatform} onRefresh={refetch} />
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6 mt-6">
            <PlatformCredentialsOverview />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6 mt-6">
            <TenstreetNavigationCard />
          </TabsContent>
        </Tabs>

        {showAddDialog && (
          <AddPlatformDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onSuccess={handleAddSuccess}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AdNetworks;
