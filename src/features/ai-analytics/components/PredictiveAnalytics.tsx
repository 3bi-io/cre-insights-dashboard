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
import { TrendingUp, Calendar, Users, DollarSign, AlertTriangle } from 'lucide-react';

const forecastData = [
  { month: 'Jan', actual: 45, predicted: 48, confidence: 92 },
  { month: 'Feb', actual: 52, predicted: 54, confidence: 89 },
  { month: 'Mar', actual: 48, predicted: 50, confidence: 91 },
  { month: 'Apr', actual: 61, predicted: 62, confidence: 88 },
  { month: 'May', actual: 55, predicted: 58, confidence: 87 },
  { month: 'Jun', actual: null, predicted: 65, confidence: 85 },
  { month: 'Jul', actual: null, predicted: 70, confidence: 82 },
  { month: 'Aug', actual: null, predicted: 68, confidence: 80 },
];

const hiringTrendData = [
  { week: 'W1', applications: 120, qualified: 45, hired: 12, predicted: 14 },
  { week: 'W2', applications: 135, qualified: 52, hired: 15, predicted: 16 },
  { week: 'W3', applications: 142, qualified: 58, hired: 16, predicted: 18 },
  { week: 'W4', applications: 128, qualified: 48, hired: 13, predicted: 15 },
  { week: 'W5', applications: 156, qualified: 62, hired: null, predicted: 19 },
  { week: 'W6', applications: null, qualified: null, hired: null, predicted: 21 },
];

const candidateFlowData = [
  { stage: 'Applied', count: 847, dropout: 15, predicted: 820 },
  { stage: 'Screened', count: 720, dropout: 22, predicted: 698 },
  { stage: 'Interviewed', count: 561, dropout: 18, predicted: 548 },
  { stage: 'Offered', count: 460, dropout: 8, predicted: 451 },
  { stage: 'Hired', count: 423, dropout: 0, predicted: 415 },
];

const costPredictionData = [
  { category: 'Sourcing', current: 12500, predicted: 10800, savings: 1700 },
  { category: 'Screening', current: 8900, predicted: 6200, savings: 2700 },
  { category: 'Interviews', current: 15600, predicted: 13100, savings: 2500 },
  { category: 'Onboarding', current: 7200, predicted: 6500, savings: 700 },
];

export const PredictiveAnalytics: React.FC = () => {
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
          87% Accuracy
        </Badge>
      </div>

      <Tabs defaultValue="hiring" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hiring">Hiring Forecast</TabsTrigger>
          <TabsTrigger value="flow">Candidate Flow</TabsTrigger>
          <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Prediction</TabsTrigger>
        </TabsList>

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
                  />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Next Month</p>
                  <p className="text-2xl font-bold text-primary">65</p>
                  <p className="text-xs text-muted-foreground">predicted hires</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-success">85%</p>
                  <p className="text-xs text-muted-foreground">prediction accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Growth</p>
                  <p className="text-2xl font-bold text-primary">+18%</p>
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
                <BarChart data={candidateFlowData} layout="vertical">
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

              <div className="mt-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">High Dropout Alert</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      22% dropout rate detected at screening stage. Consider simplifying the process or improving candidate communication.
                    </p>
                  </div>
                </div>
              </div>
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
                <LineChart data={hiringTrendData}>
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
                  />
                  <Line 
                    type="monotone" 
                    dataKey="qualified" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hired" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
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
                <BarChart data={costPredictionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="current" fill="hsl(var(--destructive))" name="Current Cost" />
                  <Bar dataKey="predicted" fill="hsl(var(--success))" name="Predicted Cost" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {costPredictionData.map((item) => (
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
                  $7,600 <span className="text-sm font-normal text-muted-foreground">per month</span>
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
