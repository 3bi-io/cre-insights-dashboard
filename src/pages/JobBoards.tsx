import React from 'react';
import GoogleJobsPlatformActions from '@/components/platforms/GoogleJobsPlatformActions';
import CraigslistPlatformActions from '@/components/platforms/CraigslistPlatformActions';
import SimplyHiredPlatformActions from '@/components/platforms/SimplyHiredPlatformActions';
import GlassdoorPlatformActions from '@/components/platforms/GlassdoorPlatformActions';
import TruckDriverJobs411PlatformActions from '@/components/platforms/TruckDriverJobs411PlatformActions';
import AdzunaPlatformActions from '@/components/platforms/AdzunaPlatformActions';
import { PlatformAccessGuard } from '@/components/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rss, FileText, DollarSign, Building2, TrendingUp, Truck } from 'lucide-react';
import PageLayout from '@/components/PageLayout';

const JobBoards = () => {
  return (
    <PageLayout 
      title="Job Boards" 
      description="Manage XML feed distribution to job boards"
    >
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
              Job Boards
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Distribute your jobs to job boards via XML feeds
            </p>
          </div>
        </div>

        <Tabs defaultValue="google-jobs" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="google-jobs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Google Jobs
            </TabsTrigger>
            <TabsTrigger value="adzuna" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Adzuna
            </TabsTrigger>
            <TabsTrigger value="simplyhired" className="flex items-center gap-2">
              <Rss className="w-4 h-4" />
              SimplyHired
            </TabsTrigger>
            <TabsTrigger value="glassdoor" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Glassdoor
            </TabsTrigger>
            <TabsTrigger value="craigslist" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Craigslist
            </TabsTrigger>
            <TabsTrigger value="trucking" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              CDL Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google-jobs" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="google-jobs">
              <GoogleJobsPlatformActions />
            </PlatformAccessGuard>
          </TabsContent>

          <TabsContent value="adzuna" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="adzuna">
              <AdzunaPlatformActions />
            </PlatformAccessGuard>
          </TabsContent>

          <TabsContent value="simplyhired" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="simplyhired">
              <SimplyHiredPlatformActions />
            </PlatformAccessGuard>
          </TabsContent>

          <TabsContent value="glassdoor" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="glassdoor">
              <GlassdoorPlatformActions />
            </PlatformAccessGuard>
          </TabsContent>

          <TabsContent value="craigslist" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="craigslist">
              <CraigslistPlatformActions />
            </PlatformAccessGuard>
          </TabsContent>

          <TabsContent value="trucking" className="space-y-6 mt-6">
            <PlatformAccessGuard platformName="truck-driver-jobs-411">
              <TruckDriverJobs411PlatformActions />
            </PlatformAccessGuard>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default JobBoards;
