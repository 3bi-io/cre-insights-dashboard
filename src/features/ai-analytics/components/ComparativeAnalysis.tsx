import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, DollarSign, Users, Target } from 'lucide-react';
import type { ComparisonMetric, RadarPoint } from '../hooks';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface ComparisonCardProps {
  data: ComparisonMetric;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ data }) => {
  const improvementColor = data.improvement > 0 ? 'text-success' : 'text-destructive';
  const bgColor = data.improvement > 0 ? 'bg-success/10' : 'bg-destructive/10';
  
  const getIcon = (metric: string) => {
    switch (metric) {
      case 'Time to Hire': return <Clock className="w-4 h-4" />;
      case 'Cost per Hire': return <DollarSign className="w-4 h-4" />;
      case 'Quality Score': return <Target className="w-4 h-4" />;
      case 'Candidates Screened': return <Users className="w-4 h-4" />;
      case 'Interview Success': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  // Calculate progress percentages relative to each other
  const maxValue = Math.max(data.traditional, data.aiEnhanced);
  const traditionalPercent = (data.traditional / maxValue) * 100;
  const aiPercent = (data.aiEnhanced / maxValue) * 100;
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {getIcon(data.metric)}
              </div>
              <span className="font-medium text-sm">{data.metric}</span>
            </div>
            <Badge className={`${bgColor} ${improvementColor}`}>
              {data.improvement > 0 ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
              {Math.abs(data.improvement)}%
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Traditional</span>
                <span className="font-medium">
                  {data.unit === '$' ? data.unit : ''}{data.traditional.toLocaleString()}{data.unit !== '$' ? data.unit : ''}
                </span>
              </div>
              <Progress value={traditionalPercent} className="h-1.5" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">AI-Enhanced</span>
                <span className="font-medium text-success">
                  {data.unit === '$' ? data.unit : ''}{data.aiEnhanced.toLocaleString()}{data.unit !== '$' ? data.unit : ''}
                </span>
              </div>
              <Progress value={aiPercent} className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ComparativeAnalysisProps {
  data: {
    metrics: ComparisonMetric[];
    radarData: RadarPoint[];
    totalSavings: number;
    timeSaved: number;
    qualityIncrease: number;
  };
}

export const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ data }) => {
  const { metrics, radarData, totalSavings, timeSaved, qualityIncrease } = data;

  // Transform metrics for bar chart
  const barChartData = metrics.map(item => ({
    name: item.metric,
    Traditional: item.traditional,
    'AI-Enhanced': item.aiEnhanced,
  }));

  if (!metrics.length) {
    return (
      <AnalyticsEmptyState
        title="No Comparison Data"
        description="Comparison metrics require both AI and traditional hiring data to calculate improvements."
        icon="chart"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI vs Traditional Recruiting</h3>
        <p className="text-sm text-muted-foreground">
          Performance comparison across key recruitment metrics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/20">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold text-success">
                  ${totalSavings.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">in the last quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
                <p className="text-2xl font-bold text-primary">{timeSaved} hrs</p>
                <p className="text-xs text-muted-foreground">recruiter hours saved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning/20">
                <Target className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quality Increase</p>
                <p className="text-2xl font-bold text-warning">+{qualityIncrease}%</p>
                <p className="text-xs text-muted-foreground">hire quality improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metric Comparison Cards */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Detailed Metric Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((item) => (
            <ComparisonCard key={item.metric} data={item} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Comparison</CardTitle>
            <CardDescription>
              Traditional vs AI-enhanced recruitment metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Traditional" fill="hsl(var(--muted))" />
                <Bar dataKey="AI-Enhanced" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Performance Radar</CardTitle>
            <CardDescription>
              Multi-dimensional performance analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Traditional" 
                  dataKey="traditional" 
                  stroke="hsl(var(--muted-foreground))" 
                  fill="hsl(var(--muted))" 
                  fillOpacity={0.5} 
                />
                <Radar 
                  name="AI-Enhanced" 
                  dataKey="aiEnhanced" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6} 
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.slice(0, 3).map((metric, index) => {
              const colors = ['bg-success/10 border-success/20', 'bg-primary/10 border-primary/20', 'bg-warning/10 border-warning/20'];
              const textColors = ['text-success', 'text-primary', 'text-warning'];
              
              return (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${colors[index]} border`}>
                  <CheckCircle2 className={`w-5 h-5 ${textColors[index]} mt-0.5`} />
                  <div>
                    <p className="font-medium text-sm">{metric.improvement}% improvement in {metric.metric.toLowerCase()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metric.metric}: {metric.unit === '$' ? metric.unit : ''}{metric.traditional.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''} → {metric.unit === '$' ? metric.unit : ''}{metric.aiEnhanced.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''} through AI-powered automation
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparativeAnalysis;
