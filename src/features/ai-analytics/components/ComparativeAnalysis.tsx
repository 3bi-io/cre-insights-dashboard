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

const comparisonData = [
  {
    metric: 'Time to Hire',
    traditional: 42,
    aiEnhanced: 26,
    unit: 'days',
    improvement: 38,
    icon: <Clock className="w-4 h-4" />
  },
  {
    metric: 'Cost per Hire',
    traditional: 4200,
    aiEnhanced: 2800,
    unit: '$',
    improvement: 33,
    icon: <DollarSign className="w-4 h-4" />
  },
  {
    metric: 'Quality Score',
    traditional: 68,
    aiEnhanced: 84,
    unit: '/100',
    improvement: 24,
    icon: <Target className="w-4 h-4" />
  },
  {
    metric: 'Candidates Screened',
    traditional: 45,
    aiEnhanced: 127,
    unit: 'per day',
    improvement: 182,
    icon: <Users className="w-4 h-4" />
  },
  {
    metric: 'Interview Success',
    traditional: 62,
    aiEnhanced: 81,
    unit: '%',
    improvement: 31,
    icon: <CheckCircle2 className="w-4 h-4" />
  }
];

const radarData = [
  { metric: 'Speed', traditional: 65, aiEnhanced: 92 },
  { metric: 'Accuracy', traditional: 72, aiEnhanced: 88 },
  { metric: 'Cost Efficiency', traditional: 58, aiEnhanced: 89 },
  { metric: 'Candidate Experience', traditional: 70, aiEnhanced: 85 },
  { metric: 'Quality Match', traditional: 68, aiEnhanced: 91 },
  { metric: 'Bias Reduction', traditional: 45, aiEnhanced: 87 },
];

const barChartData = comparisonData.map(item => ({
  name: item.metric,
  Traditional: item.traditional,
  'AI-Enhanced': item.aiEnhanced,
}));

interface ComparisonCardProps {
  data: typeof comparisonData[0];
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ data }) => {
  const improvementColor = data.improvement > 0 ? 'text-success' : 'text-destructive';
  const bgColor = data.improvement > 0 ? 'bg-success/10' : 'bg-destructive/10';
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {data.icon}
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
                  {data.unit === '$' ? data.unit : ''}{data.traditional}{data.unit !== '$' ? data.unit : ''}
                </span>
              </div>
              <Progress value={65} className="h-1.5" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">AI-Enhanced</span>
                <span className="font-medium text-success">
                  {data.unit === '$' ? data.unit : ''}{data.aiEnhanced}{data.unit !== '$' ? data.unit : ''}
                </span>
              </div>
              <Progress value={90} className="h-1.5" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ComparativeAnalysis: React.FC = () => {
  const totalSavings = 125000;
  const timesSaved = 240;
  const qualityIncrease = 27;

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
                <p className="text-2xl font-bold text-primary">{timesSaved} hrs</p>
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
          {comparisonData.map((item) => (
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
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
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
                <PolarAngleAxis dataKey="metric" />
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
            <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-sm">182% increase in candidate screening</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI automation enables reviewing 127 candidates per day vs 45 with traditional methods
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">38% reduction in time-to-hire</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Average hiring cycle reduced from 42 to 26 days through AI-powered automation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <CheckCircle2 className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-sm">33% lower cost per hire</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cost reduced from $4,200 to $2,800 per hire through improved efficiency and accuracy
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparativeAnalysis;
