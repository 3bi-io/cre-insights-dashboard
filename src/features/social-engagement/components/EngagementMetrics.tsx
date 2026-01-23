import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

interface EngagementMetricsProps {
  organizationId?: string;
}

const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  whatsapp: '#25D366',
  linkedin: '#0A66C2',
};

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral: '#94a3b8',
  negative: '#ef4444',
};

export function EngagementMetrics({ organizationId }: EngagementMetricsProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['social-metrics', organizationId],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('social_engagement_metrics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: interactions } = useQuery({
    queryKey: ['social-interactions-stats', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_interactions')
        .select('platform, intent_classification, sentiment_label, auto_responded, created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', format(subDays(new Date(), 30), 'yyyy-MM-dd'));

      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Process data for charts
  const platformData = interactions?.reduce((acc, i) => {
    const platform = i.platform as string;
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformChartData = Object.entries(platformData || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PLATFORM_COLORS[name as keyof typeof PLATFORM_COLORS] || '#666',
  }));

  const intentData = interactions?.reduce((acc, i) => {
    const intent = i.intent_classification || 'unknown';
    acc[intent] = (acc[intent] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const intentChartData = Object.entries(intentData || {})
    .map(([name, value]) => ({
      name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const sentimentData = interactions?.reduce((acc, i) => {
    const sentiment = i.sentiment_label || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentChartData = Object.entries(sentimentData || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SENTIMENT_COLORS[name as keyof typeof SENTIMENT_COLORS] || '#666',
  }));

  const autoResponseRate = interactions?.length 
    ? Math.round((interactions.filter(i => i.auto_responded).length / interactions.length) * 100)
    : 0;

  // Daily trend data
  const dailyData = metrics?.reduce((acc, m) => {
    const existing = acc.find(d => d.date === m.date);
    if (existing) {
      existing.interactions += m.interactions_received || 0;
      existing.responses += (m.auto_responses_sent || 0) + (m.manual_responses_sent || 0);
    } else {
      acc.push({
        date: m.date,
        interactions: m.interactions_received || 0,
        responses: (m.auto_responses_sent || 0) + (m.manual_responses_sent || 0),
      });
    }
    return acc;
  }, [] as Array<{ date: string; interactions: number; responses: number }>);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Interactions</CardDescription>
            <CardTitle className="text-3xl">{interactions?.length || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Auto-Response Rate</CardDescription>
            <CardTitle className="text-3xl">{autoResponseRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Handled by AI</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Job Inquiries</CardDescription>
            <CardTitle className="text-3xl">
              {interactions?.filter(i => i.intent_classification === 'job_inquiry').length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Potential candidates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Positive Sentiment</CardDescription>
            <CardTitle className="text-3xl">
              {interactions?.length 
                ? Math.round((interactions.filter(i => i.sentiment_label === 'positive').length / interactions.length) * 100)
                : 0}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Of all interactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Platform Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Interactions by Platform</CardTitle>
            <CardDescription>Distribution across social networks</CardDescription>
          </CardHeader>
          <CardContent>
            {platformChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={platformChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {platformChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Message Intent</CardTitle>
            <CardDescription>What users are asking about</CardDescription>
          </CardHeader>
          <CardContent>
            {intentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={intentChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Overall tone of interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Interactions and responses over time</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyData && dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value as string), 'MMM d, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="interactions" 
                    stroke="hsl(var(--primary))" 
                    name="Interactions"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responses" 
                    stroke="hsl(var(--muted-foreground))" 
                    name="Responses"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
