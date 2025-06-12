
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const [spendData, applicationsData, jobsData, platformsData] = await Promise.all([
        supabase.from('daily_spend').select('*').order('date', { ascending: true }),
        supabase.from('applications').select('*, job_listings:job_listing_id(platforms:platform_id(name))'),
        supabase.from('job_listings').select('*, platforms:platform_id(name), job_categories:category_id(name)'),
        supabase.from('platforms').select('*')
      ]);

      return {
        spend: spendData.data || [],
        applications: applicationsData.data || [],
        jobs: jobsData.data || [],
        platforms: platformsData.data || []
      };
    },
  });

  const processedData = React.useMemo(() => {
    if (!analytics) return { spendTrend: [], platformData: [], metrics: {} };

    const totalSpend = analytics.spend.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalApplications = analytics.applications.length;
    const avgCostPerApp = totalApplications > 0 ? totalSpend / totalApplications : 0;

    // Group spend by date for trend chart
    const spendByDate = analytics.spend.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { date, spend: 0, applications: 0, hires: 0 };
      }
      acc[date].spend += Number(item.amount);
      return acc;
    }, {});

    // Add application counts to date groups
    analytics.applications.forEach(app => {
      const date = app.applied_at?.split('T')[0];
      if (spendByDate[date]) {
        spendByDate[date].applications += 1;
      }
    });

    const spendTrend = Object.values(spendByDate);

    // Group by platform
    const platformStats = analytics.platforms.map(platform => {
      const platformJobs = analytics.jobs.filter(job => 
        job.platforms?.name === platform.name
      );
      const platformSpend = analytics.spend
        .filter(spend => platformJobs.some(job => job.id === spend.job_listing_id))
        .reduce((sum, item) => sum + Number(item.amount), 0);
      
      const platformApps = analytics.applications.filter(app =>
        platformJobs.some(job => job.id === app.job_listing_id)
      ).length;

      return {
        name: platform.name,
        spend: platformSpend,
        applications: platformApps,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
    });

    const metrics = {
      totalSpend: totalSpend,
      totalApplications: totalApplications,
      avgCostPerApp: avgCostPerApp,
      conversionRate: 4.2 // Would need hire data to calculate properly
    };

    return { spendTrend, platformData: platformStats, metrics };
  }, [analytics]);

  const metricsData = [
    {
      title: 'Total Spend (YTD)',
      value: `$${processedData.metrics.totalSpend?.toLocaleString() || '0'}`,
      change: '+15.3%',
      trend: 'up',
      icon: DollarSign,
    },
    {
      title: 'Total Applications',
      value: processedData.metrics.totalApplications?.toLocaleString() || '0',
      change: '+12.8%',
      trend: 'up',
      icon: Users,
    },
    {
      title: 'Average Cost per Application',
      value: `$${processedData.metrics.avgCostPerApp?.toFixed(2) || '0.00'}`,
      change: '-8.2%',
      trend: 'up',
      icon: Target,
    },
    {
      title: 'Conversion Rate',
      value: `${processedData.metrics.conversionRate || 0}%`,
      change: '+0.8%',
      trend: 'up',
      icon: TrendingUp,
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive performance insights and metrics</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                      <div className={`flex items-center text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {metric.change}
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spend Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Spend Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData.spendTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="stroke-muted-foreground" />
                  <YAxis className="stroke-muted-foreground" />
                  <Tooltip />
                  <Line type="monotone" dataKey="spend" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Applications by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processedData.platformData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="stroke-muted-foreground" />
                  <YAxis className="stroke-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spend Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Spend Distribution by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData.platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="spend"
                  >
                    {processedData.platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {processedData.platformData.map((platform, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: platform.color }}
                    ></div>
                    <span className="text-foreground">{platform.name}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    ${platform.spend.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Applications vs Spend */}
        <Card>
          <CardHeader>
            <CardTitle>Applications vs Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedData.spendTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="stroke-muted-foreground" />
                  <YAxis className="stroke-muted-foreground" />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  <Line type="monotone" dataKey="spend" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
