import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, UserCheck, Calendar, Download } from 'lucide-react';
import ApplicationTrendsChart from '@/components/charts/ApplicationTrendsChart';
import SourcePerformanceChart from '@/components/charts/SourcePerformanceChart';
import ConversionFunnelChart from '@/components/charts/ConversionFunnelChart';
import { ExportDataDialog } from '@/components/tenstreet/ExportDataDialog';
import { useState } from 'react';

export default function TenstreetFocus() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportData, setExportData] = useState<any[]>([]);
  
  // Fetch key metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['tenstreet-metrics'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_application_metrics_summary');
      if (error) throw error;
      return data;
    }
  });

  // Fetch application trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['tenstreet-trends'],
    queryFn: async () => {
      // Mock data for now - would connect to actual Tenstreet analytics
      return [
        { date: 'Mon', applications: 45 },
        { date: 'Tue', applications: 52 },
        { date: 'Wed', applications: 38 },
        { date: 'Thu', applications: 61 },
        { date: 'Fri', applications: 48 },
        { date: 'Sat', applications: 35 },
        { date: 'Sun', applications: 29 }
      ];
    }
  });

  // Fetch source performance
  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['tenstreet-sources'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_source_performance_stats');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tenstreet Focus Analytics</h1>
          <p className="text-muted-foreground">
            Real-time insights into your applicant pipeline and recruiting performance
          </p>
        </div>
        <Button 
          variant="outline"
          onClick={() => {
            // Prepare data for export
            const dataToExport = sources || [];
            setExportData(dataToExport);
            setShowExportDialog(true);
          }}
          disabled={!sources || sources.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : (metrics?.total_applications || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Applicants</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : (metrics?.active_applicants || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : (metrics?.hired_count || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics?.conversion_rate || 0}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? '...' : `${metrics?.avg_time_to_hire || 0}d`}
            </div>
            <p className="text-xs text-muted-foreground">
              -3 days improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Application Trends</TabsTrigger>
          <TabsTrigger value="sources">Source Performance</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <ApplicationTrendsChart 
            data={trends || []}
            isLoading={trendsLoading}
          />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <SourcePerformanceChart 
            data={sources || []}
            isLoading={sourcesLoading}
          />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <ConversionFunnelChart />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDataDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        data={exportData}
        availableFields={exportData.length > 0 ? Object.keys(exportData[0]) : []}
        filename="tenstreet-analytics"
        title="Tenstreet Analytics Report"
      />
    </div>
  );
}
