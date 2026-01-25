import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AlertTriangle, Shield, CheckCircle2, TrendingDown, Info } from 'lucide-react';
import type { BiasMetric, DiversityPoint, OutcomeDistributionPoint, FairnessDistributionPoint } from '../hooks';
import { AnalyticsEmptyState } from './AnalyticsEmptyState';

interface BiasScoreCardProps {
  category: string;
  score: number;
  threshold: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

const BiasScoreCard: React.FC<BiasScoreCardProps> = ({ category, score, threshold, status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'excellent':
        return {
          color: 'text-success',
          bg: 'bg-success/10',
          icon: <CheckCircle2 className="w-4 h-4" />
        };
      case 'good':
        return {
          color: 'text-primary',
          bg: 'bg-primary/10',
          icon: <CheckCircle2 className="w-4 h-4" />
        };
      case 'warning':
        return {
          color: 'text-warning',
          bg: 'bg-warning/10',
          icon: <AlertTriangle className="w-4 h-4" />
        };
      case 'danger':
        return {
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          icon: <AlertTriangle className="w-4 h-4" />
        };
    }
  };

  const config = getStatusConfig();
  const percentage = ((threshold - score) / threshold) * 100;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{category}</span>
            <div className={`flex items-center gap-1 ${config.color}`}>
              {config.icon}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bias Score</span>
              <span className={`font-medium ${config.color}`}>
                {score}/{threshold}
              </span>
            </div>
            <Progress value={Math.max(0, percentage)} className="h-2" />
          </div>

          <div className={`text-xs ${config.color} ${config.bg} p-2 rounded`}>
            {status === 'excellent' && '✓ Excellent - Well below threshold'}
            {status === 'good' && '✓ Good - Within acceptable range'}
            {status === 'warning' && '⚠ Warning - Near threshold'}
            {status === 'danger' && '⚠ Action needed - Above threshold'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface BiasAnalysisProps {
  data: {
    metrics: BiasMetric[];
    fairnessScore: number;
    overallBiasScore: number;
    issuesDetected: number;
    diversityData: DiversityPoint[];
    outcomeDistribution: OutcomeDistributionPoint[];
    fairnessDistribution: FairnessDistributionPoint[];
  };
}

export const BiasAnalysis: React.FC<BiasAnalysisProps> = ({ data }) => {
  const { 
    metrics, 
    fairnessScore, 
    overallBiasScore, 
    issuesDetected, 
    diversityData,
    outcomeDistribution,
    fairnessDistribution
  } = data;

  // Find warning issues
  const warningMetrics = metrics.filter(m => m.status === 'warning' || m.status === 'danger');

  if (!metrics.length) {
    return (
      <AnalyticsEmptyState
        title="No Bias Analysis Data"
        description="Bias analysis requires AI scoring data. Start analyzing candidates to see fairness metrics."
        icon="chart"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Bias & Fairness Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitoring AI decision-making for fairness and equity
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingDown className="w-3 h-3" />
          {overallBiasScore}/100 Bias Score
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/20">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fairness Score</p>
                <p className="text-3xl font-bold text-success">{fairnessScore}/100</p>
                <p className="text-xs text-muted-foreground">Overall system fairness</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bias Score</p>
                <p className="text-3xl font-bold text-primary">{overallBiasScore}/100</p>
                <p className="text-xs text-muted-foreground">Lower is better</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={issuesDetected > 0 ? 'border-warning' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${issuesDetected > 0 ? 'bg-warning/10' : 'bg-muted'}`}>
                <AlertTriangle className={`w-6 h-6 ${issuesDetected > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issues Detected</p>
                <p className={`text-3xl font-bold ${issuesDetected > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {issuesDetected}
                </p>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Issues */}
      {warningMetrics.length > 0 && (
        <Alert variant="default" className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription>
            <span className="font-medium">{warningMetrics[0].category} bias detected</span> - The AI model shows a slight preference in this category. Review and adjust training data or feature weights.
          </AlertDescription>
        </Alert>
      )}

      {/* Bias Metrics by Category */}
      <div>
        <h4 className="text-sm font-semibold mb-4">Bias Metrics by Category</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <BiasScoreCard
              key={metric.category}
              category={metric.category}
              score={metric.score}
              threshold={metric.threshold}
              status={metric.status}
            />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Diversity in Hiring Funnel</CardTitle>
            <CardDescription>
              Diversity representation across hiring stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={diversityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="diverse" stackId="a" fill="hsl(var(--primary))" name="Diverse Candidates" />
                <Bar dataKey="nonDiverse" stackId="a" fill="hsl(var(--muted))" name="Other Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Selection Rate by Group</CardTitle>
            <CardDescription>
              Fair distribution of hiring outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={outcomeDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="group" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="selected" fill="hsl(var(--success))" name="Selected" />
                <Bar dataKey="total" fill="hsl(var(--muted))" name="Total Applied" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Fairness Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Fairness Distribution</CardTitle>
            <CardDescription>
              Breakdown of fairness ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={fairnessDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {fairnessDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fairness Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.filter(m => m.status === 'excellent' || m.status === 'good').length > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Bias Well Controlled</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Continue monitoring these metrics and maintain current training practices.
                    </p>
                  </div>
                </div>
              )}

              {warningMetrics.map((metric, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{metric.category} Bias Detected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Review feature weights for {metric.category.toLowerCase()} factors. Consider implementing experience-based alternatives.
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">Regular Audits Recommended</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Schedule monthly fairness audits and bias reviews to ensure continued compliance with fair hiring practices.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Bias Detection Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h5 className="font-medium mb-2">Detection Methods</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Disparate Impact Analysis - Compares selection rates across protected groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Equal Opportunity Difference - Measures true positive rate parity</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Statistical Parity - Evaluates demographic distribution in outcomes</span>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Mitigation Strategies</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Adversarial debiasing during model training</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Reweighting of training data to balance representation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Post-processing adjustments to ensure fairness constraints</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiasAnalysis;
