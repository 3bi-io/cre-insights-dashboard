import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  Users, Eye, Clock, TrendingDown, Globe, Smartphone, 
  MousePointerClick, Activity, Monitor, Link, Timer, 
  UserPlus, UserCheck, FileText, Laptop
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AdminPageLayout from "@/features/shared/components/AdminPageLayout";
import { ActiveUsersIndicator } from "@/components/analytics/ActiveUsersIndicator";

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
      <AdminPageLayout
        title="Visitor Analytics"
        description="Comprehensive visitor insights and metrics"
        requiredRole="super_admin"
        isLoading={true}
      >
        <div />
      </AdminPageLayout>
    );
  }

  const timeSeries = analytics?.timeSeries || {};
  const lists = analytics?.lists || {};
  const metrics = analytics?.metrics || {};
  const hourlyDistribution = analytics?.hourlyDistribution || [];
  const recentActivity = analytics?.recentActivity || [];

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
  const totalSessions = metrics.totalSessions || 0;
  const avgPagesPerSession = metrics.avgPagesPerSession || 0;
  const newVisitors = metrics.newVisitors || 0;
  const returningVisitors = metrics.returningVisitors || 0;

  // Prepare chart data with safe mapping
  const chartData = visitorsData.map((item: any, index: number) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    visitors: item.value || 0,
    pageviews: pageviewsData[index]?.value || 0,
    sessionDuration: sessionDurationData[index]?.value || 0,
    bounceRate: bounceRateData[index]?.value || 0,
  }));

  // New vs returning data for pie chart
  const visitorTypeData = [
    { label: 'New', value: newVisitors },
    { label: 'Returning', value: returningVisitors }
  ];

  const hasData = chartData.length > 0 || totalVisitors > 0;

  const timeRangeSelect = (
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
  );

  return (
    <AdminPageLayout
      title="Visitor Analytics"
      description="Comprehensive visitor insights and metrics"
      requiredRole="super_admin"
      actions={timeRangeSelect}
    >
      <div className="space-y-6">

      {/* Real-time Active Users */}
      <div className="grid gap-4 md:grid-cols-4">
        <ActiveUsersIndicator showDetails className="md:col-span-1" />
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Real-time Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              Live visitor tracking updates automatically every 30 seconds. Users are considered active if they've had activity within the last 5 minutes.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-muted-foreground">Active now</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Desktop users</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Mobile users</span>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Key Metrics - 6 cards */}
      {!error && hasData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            title="Total Sessions"
            value={totalSessions.toLocaleString()}
            icon={Activity}
            subtitle={`${avgPagesPerSession} pages/session`}
          />
          <MetricCard
            title="Avg Session"
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
          <MetricCard
            title="New Visitors"
            value={`${totalVisitors > 0 ? Math.round((newVisitors / totalVisitors) * 100) : 0}%`}
            icon={UserPlus}
            subtitle={`${newVisitors} new, ${returningVisitors} returning`}
          />
        </div>
      )}

      {/* Charts */}
      {!error && hasData && (
        <Tabs defaultValue="visitors" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
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

          {/* New vs Returning Visitors */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>New vs Returning Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={visitorTypeData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.label}: ${entry.value}`}
                    >
                      {visitorTypeData.map((_, index) => (
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
                <CardTitle>Visitor Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-chart-1" />
                    <span className="font-medium">New Visitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{newVisitors}</span>
                    <Badge variant="outline">{totalVisitors > 0 ? Math.round((newVisitors / totalVisitors) * 100) : 0}%</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-chart-2" />
                    <span className="font-medium">Returning Visitors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{returningVisitors}</span>
                    <Badge variant="outline">{totalVisitors > 0 ? Math.round((returningVisitors / totalVisitors) * 100) : 0}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium block truncate">{page.title || page.label}</span>
                          <span className="text-xs text-muted-foreground truncate block">{page.label}</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground ml-2">{(page.value || 0).toLocaleString()} views</span>
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

          {/* Detailed Referrers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Top Referrers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lists.referrer?.data && lists.referrer.data.length > 0 ? (
                  lists.referrer.data.slice(0, 15).map((ref: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{ref.label}</span>
                      </div>
                      <Badge variant="secondary">{(ref.value || 0).toLocaleString()}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No referrer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technology Tab - Browser & OS */}
        <TabsContent value="technology" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Browser Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lists.browser?.data || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="label" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
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
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="h-5 w-5" />
                  Operating System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lists.os?.data || []}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => entry.label}
                    >
                      {(lists.os?.data || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Browser & OS breakdown lists */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Browser Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lists.browser?.data && lists.browser.data.length > 0 ? (
                    lists.browser.data.map((browser: any, index: number) => {
                      const percentage = totalPageviews > 0 ? (browser.value / totalPageviews * 100) : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{browser.label}</span>
                            <span className="text-muted-foreground">{browser.value.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No browser data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OS Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lists.os?.data && lists.os.data.length > 0 ? (
                    lists.os.data.map((os: any, index: number) => {
                      const percentage = totalPageviews > 0 ? (os.value / totalPageviews * 100) : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{os.label}</span>
                            <span className="text-muted-foreground">{os.value.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No OS data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab - Hourly & Recent */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Hourly Activity Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))" 
                    fillOpacity={0.3}
                    name="Page Views"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{activity.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.path}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{activity.browser}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{activity.device}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
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
                    const percentage = totalSessions > 0 ? (device.value / totalSessions * 100) : 0;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium capitalize">{device.label || 'Unknown'}</span>
                          </div>
                          <span className="text-muted-foreground">{(device.value || 0).toLocaleString()} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
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
    </AdminPageLayout>
  );
};

export default VisitorAnalytics;
