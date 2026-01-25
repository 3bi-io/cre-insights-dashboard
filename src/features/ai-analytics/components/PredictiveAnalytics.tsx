import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Users, DollarSign, AlertTriangle } from 'lucide-react';
import type { ForecastPoint, HiringTrendPoint, CandidateFlowPoint, CostPredictionPoint } from '../hooks';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface PredictiveAnalyticsProps {
  data: {
    forecastData: ForecastPoint[];
    hiringTrends: HiringTrendPoint[];
    candidateFlow: CandidateFlowPoint[];
    costPredictions: CostPredictionPoint[];
    growthPercent: number;
  };
}

export const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ data }) => {
  const { forecastData, hiringTrends, candidateFlow, costPredictions, growthPercent } = data;
  
  // Calculate summary metrics
  const nextMonthPredicted = forecastData.find(f => f.actual === null)?.predicted || 0;
  const avgConfidence = Math.round(forecastData.reduce((sum, f) => sum + f.confidence, 0) / forecastData.length);
  const totalSavings = costPredictions.reduce((sum, c) => sum + c.savings, 0);
  
  // Find highest dropout stage
  const highestDropout = candidateFlow.reduce((max, stage) => 
    stage.dropout > max.dropout ? stage : max, candidateFlow[0]);

  // Determine if growth is positive or negative
  const isPositiveGrowth = growthPercent >= 0;

  if (!forecastData.length) {
    return (
      <AnalyticsEmptyState
        title="No Prediction Data"
        description="More historical data is needed to generate accurate predictions. Keep analyzing candidates to build the dataset."
        icon="trending"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Predictive Analytics & Forecasting</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered predictions based on historical data and trends
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="w-3 h-3" />
          {avgConfidence}% Accuracy
        </Badge>
      </div>

      <Tabs defaultValue="hiring" className="w-full">
        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          <div className="inline-flex h-10 items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground min-w-max md:min-w-0 md:w-full md:grid md:grid-cols-4">
            <TabsTrigger value="hiring" className="whitespace-nowrap px-3 py-1.5 min-h-[36px]">Hiring Forecast</TabsTrigger>
            <TabsTrigger value="flow" className="whitespace-nowrap px-3 py-1.5 min-h-[36px]">Candidate Flow</TabsTrigger>
            <TabsTrigger value="trends" className="whitespace-nowrap px-3 py-1.5 min-h-[36px]">Weekly Trends</TabsTrigger>
            <TabsTrigger value="costs" className="whitespace-nowrap px-3 py-1.5 min-h-[36px]">Cost Prediction</TabsTrigger>
          </div>
        </div>

        <TabsContent value="hiring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Monthly Hiring Forecast
              </CardTitle>
              <CardDescription>
                Predicted hiring volume with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" label={{ value: 'Hires', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Confidence %', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Area 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="confidence" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.1}
                    stroke="none"
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual"
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    name="Predicted"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Next Month</p>
                  <p className="text-2xl font-bold text-primary">{nextMonthPredicted}</p>
                  <p className="text-xs text-muted-foreground">predicted hires</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-success">{avgConfidence}%</p>
                  <p className="text-xs text-muted-foreground">prediction accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Growth</p>
                  <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${isPositiveGrowth ? 'text-success' : 'text-destructive'}`}>
                    {isPositiveGrowth ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {isPositiveGrowth ? '+' : ''}{growthPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground">vs last period</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Candidate Funnel Analysis
              </CardTitle>
              <CardDescription>
                Predicted vs actual candidate progression through hiring stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={candidateFlow} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Actual" />
                  <Bar dataKey="predicted" fill="hsl(var(--warning))" name="Predicted" />
                  <Bar dataKey="dropout" fill="hsl(var(--destructive))" name="Dropout" />
                </BarChart>
              </ResponsiveContainer>

              {highestDropout.dropout > 15 && (
                <div className="mt-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">High Dropout Alert</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {highestDropout.dropout}% dropout rate detected at {highestDropout.stage.toLowerCase()} stage. Consider simplifying the process or improving candidate communication.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hiring Trends</CardTitle>
              <CardDescription>
                Application volume and conversion predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={hiringTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Applications"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="qualified" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Qualified"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hired" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    name="Hired"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicted"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Cost Optimization Forecast
              </CardTitle>
              <CardDescription>
                Predicted cost savings through AI optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={costPredictions}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="current" fill="hsl(var(--destructive))" name="Current Cost" />
                  <Bar dataKey="predicted" fill="hsl(var(--success))" name="Predicted Cost" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {costPredictions.map((item) => (
                  <div key={item.category} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                    <p className="text-lg font-bold text-success">
                      ${item.savings.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">potential savings</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                <p className="font-medium text-sm">Total Predicted Savings</p>
                <p className="text-2xl font-bold text-success mt-1">
                  ${totalSavings.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">per month</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;
