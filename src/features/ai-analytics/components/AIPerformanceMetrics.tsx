import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Brain, Target, Zap, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { PerformanceData } from '../hooks';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  description?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  subMetrics?: { label: string; value: string | number }[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  description,
  icon,
  variant = 'default',
  subMetrics
}) => {
  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-success';
    if (trend < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'danger':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return '';
    }
  };

  return (
    <Card className={`${getVariantStyles()} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{value}</span>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(trend)}`}>
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : trend < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : null}
                <span className="font-medium">{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          {subMetrics && subMetrics.length > 0 && (
            <div className="space-y-1 pt-2 border-t">
              {subMetrics.map((metric, idx) => (
                <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                  <span>{metric.label}</span>
                  <span className="font-medium">{metric.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface AIPerformanceMetricsProps {
  data: PerformanceData;
}

export const AIPerformanceMetrics: React.FC<AIPerformanceMetricsProps> = ({ data }) => {
  // Calculate accurate and uncertain/error counts
  const accurateCount = Math.round(data.candidatesAnalyzed * (data.successRate / 100));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Model Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Model Accuracy"
            value={`${data.modelAccuracy}%`}
            trend={data.accuracyTrend}
            description="Overall accuracy of AI predictions compared to actual hiring decisions"
            icon={<Target className="w-4 h-4 text-primary" />}
            variant={data.modelAccuracy >= 85 ? 'success' : data.modelAccuracy >= 75 ? 'warning' : 'danger'}
            subMetrics={[
              { label: 'Precision', value: `${Math.round(data.precision * 100)}%` },
              { label: 'Recall', value: `${Math.round(data.recall * 100)}%` }
            ]}
          />
          
          <MetricCard
            title="Confidence Score"
            value={`${data.predictionConfidence}%`}
            description="Average confidence level in AI-generated recommendations"
            icon={<Brain className="w-4 h-4 text-primary" />}
            subMetrics={[
              { label: 'High Conf.', value: `${data.highConfidencePercent}%` },
              { label: 'Med Conf.', value: `${data.medConfidencePercent}%` }
            ]}
          />
          
          <MetricCard
            title="Processing Speed"
            value={data.avgProcessingTime}
            trend={data.processingSpeed}
            description="Average time to analyze a candidate application"
            icon={<Zap className="w-4 h-4 text-primary" />}
            variant="success"
            subMetrics={[
              { label: 'Peak Time', value: data.peakProcessingTime },
              { label: 'Off-Peak', value: data.offPeakProcessingTime }
            ]}
          />
          
          <MetricCard
            title="Bias Score"
            value={`${data.biasScore}/100`}
            description="Lower scores indicate less bias in AI decisions (target: <20)"
            icon={<Activity className="w-4 h-4 text-primary" />}
            variant={data.biasScore < 20 ? 'success' : data.biasScore < 40 ? 'warning' : 'danger'}
            subMetrics={[
              { label: 'Gender', value: data.genderBiasScore },
              { label: 'Age', value: data.ageBiasScore }
            ]}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Analysis Statistics
          </CardTitle>
          <CardDescription>
            Comprehensive AI processing metrics for the current period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Candidates Analyzed</span>
                <span className="text-sm font-semibold">{data.candidatesAnalyzed.toLocaleString()}</span>
              </div>
              <Progress value={Math.min((data.candidatesAnalyzed / 1000) * 100, 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-semibold">{data.successRate}%</span>
              </div>
              <Progress value={data.successRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">System Uptime</span>
                <span className="text-sm font-semibold">{data.systemUptime.toFixed(1)}%</span>
              </div>
              <Progress value={data.systemUptime} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{data.candidatesAnalyzed}</p>
              <p className="text-xs text-muted-foreground">Total Predictions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{accurateCount}</p>
              <p className="text-xs text-muted-foreground">Accurate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{data.uncertainCount}</p>
              <p className="text-xs text-muted-foreground">Uncertain</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{data.errorCount}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPerformanceMetrics;
