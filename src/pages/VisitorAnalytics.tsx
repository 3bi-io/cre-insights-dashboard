import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Users, Eye, Clock, TrendingDown, Globe, Smartphone, 
  MousePointerClick, Activity 
} from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const VisitorAnalytics = () => {
  const [timeRange, setTimeRange] = useState("7d");

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['visitor-analytics', timeRange],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      
      switch(timeRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      const { data, error } = await supabase.functions.invoke('visitor-analytics', {
        body: {
          startdate: startDate.toISOString(),
          enddate: endDate.toISOString(),
          granularity: 'daily'
        }
      });
      
      if (error) throw error;
      return data;
    },
    retry: 1,
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const MetricCard = ({ title, value, icon: Icon, trend, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Visitor Analytics</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const timeSeries = analytics?.timeSeries || {};
  const lists = analytics?.lists || {};

  // Safe data extraction with defaults
  const visitorsData = timeSeries.visitors?.data || [];
  const pageviewsData = timeSeries.pageviews?.data || [];
  const sessionDurationData = timeSeries.sessionDuration?.data || [];
  const bounceRateData = timeSeries.bounceRate?.data || [];

  const totalVisitors = timeSeries.visitors?.total || 0;
  const totalPageviews = timeSeries.pageviews?.total || 0;
  const avgSessionDuration = timeSeries.sessionDuration?.total || 0;
  const avgBounceRate = timeSeries.bounceRate?.total || 0;
  const pagesPerVisit = timeSeries.pageviewsPerVisit?.total || 0;

  // Prepare chart data with safe mapping
  const chartData = visitorsData.map((item: any, index: number) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: item.value || 0,
    pageviews: pageviewsData[index]?.value || 0,
    sessionDuration: sessionDurationData[index]?.value || 0,
    bounceRate: bounceRateData[index]?.value || 0,
  }));

  const hasData = chartData.length > 0 || totalVisitors > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visitor Analytics</h1>
          <p className="text-muted-foreground">Comprehensive visitor insights and metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <Activity className="h-5 w-5" />
              <p>Failed to load analytics data. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!error && !isLoading && !hasData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-5 w-5" />
              <p>No analytics data available for the selected time range.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {!error && hasData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Visitors"
            value={totalVisitors.toLocaleString()}
            icon={Users}
            subtitle="Unique visitors"
          />
          <MetricCard
            title="Total Pageviews"
            value={totalPageviews.toLocaleString()}
            icon={Eye}
            subtitle={`${pagesPerVisit.toFixed(1)} pages per visit`}
          />
          <MetricCard
            title="Avg Session Duration"
            value={formatDuration(avgSessionDuration)}
            icon={Clock}
            subtitle="Time spent per visit"
          />
          <MetricCard
            title="Bounce Rate"
            value={`${avgBounceRate.toFixed(1)}%`}
            icon={TrendingDown}
            subtitle="Single page visits"
          />
        </div>
      )}

      {/* Charts */}
      {!error && hasData && (
        <Tabs defaultValue="visitors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visitors & Pageviews Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="visitors" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Visitors" />
                  <Line type="monotone" dataKey="pageviews" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Pageviews" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Session Duration Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatDuration(value)}
                    />
                    <Line type="monotone" dataKey="sessionDuration" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Duration" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bounce Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => `${value}%`}
                    />
                    <Line type="monotone" dataKey="bounceRate" stroke="hsl(var(--chart-4))" strokeWidth={2} name="Bounce Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lists.page?.data && lists.page.data.length > 0 ? (
                  lists.page.data.slice(0, 10).map((page: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{page.label || 'Unknown'}</span>
                      </div>
                      <span className="text-muted-foreground">{(page.value || 0).toLocaleString()} views</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No page data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lists.source?.data || []}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.label}
                    >
                      {(lists.source?.data || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lists.source?.data && lists.source.data.length > 0 ? (
                    lists.source.data.map((source: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="h-4 w-4" style={{ color: COLORS[index % COLORS.length] }} />
                          <span className="font-medium">{source.label || 'Unknown'}</span>
                        </div>
                        <span className="text-muted-foreground">{(source.value || 0).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No source data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lists.device?.data || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lists.country?.data && lists.country.data.length > 0 ? (
                    lists.country.data.map((country: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{country.label || 'Unknown'}</span>
                        </div>
                        <span className="text-muted-foreground">{(country.value || 0).toLocaleString()} visitors</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No country data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Device Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lists.device?.data && lists.device.data.length > 0 ? (
                  lists.device.data.map((device: any, index: number) => {
                    const percentage = totalVisitors > 0 ? (device.value / totalVisitors * 100) : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium capitalize">{device.label || 'Unknown'}</span>
                          </div>
                          <span className="text-muted-foreground">{(device.value || 0).toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${percentage}%` 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No device data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
};

export default VisitorAnalytics;
