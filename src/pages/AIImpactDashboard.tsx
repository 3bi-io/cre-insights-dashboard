import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Users, 
  Target, 
  Brain,
  Calculator,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricComparison {
  metric: string;
  traditional: number;
  aiEnhanced: number;
  improvement: number;
  unit: string;
  description: string;
}

interface PerformanceData {
  timeToHire: MetricComparison;
  qualityScore: MetricComparison;
  costPerHire: MetricComparison;
  candidateExperience: MetricComparison;
  biasReduction: MetricComparison;
  processEfficiency: MetricComparison;
}

interface AIDecisionTracking {
  totalDecisions: number;
  aiAssisted: number;
  traditional: number;
  hybridApproach: number;
  successRate: {
    ai: number;
    traditional: number;
    hybrid: number;
  };
}

const AIImpactDashboard = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [decisionData, setDecisionData] = useState<AIDecisionTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const { toast } = useToast();

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Fetch applications and their decision data
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*');

      if (error) throw error;

      // Simulate AI impact metrics (in real implementation, this would come from tracked data)
      const mockPerformanceData: PerformanceData = {
        timeToHire: {
          metric: 'Time to Hire',
          traditional: 14.2,
          aiEnhanced: 8.7,
          improvement: -38.7,
          unit: 'days',
          description: 'Average time from application to hire decision'
        },
        qualityScore: {
          metric: 'Candidate Quality Score',
          traditional: 72.3,
          aiEnhanced: 86.1,
          improvement: 19.1,
          unit: '/100',
          description: 'Quality assessment based on role requirements match'
        },
        costPerHire: {
          metric: 'Cost per Hire',
          traditional: 4200,
          aiEnhanced: 2800,
          improvement: -33.3,
          unit: '$',
          description: 'Total recruitment cost divided by successful hires'
        },
        candidateExperience: {
          metric: 'Candidate Experience',
          traditional: 6.8,
          aiEnhanced: 8.4,
          improvement: 23.5,
          unit: '/10',
          description: 'Average candidate satisfaction score'
        },
        biasReduction: {
          metric: 'Bias Reduction Score',
          traditional: 45.2,
          aiEnhanced: 78.9,
          improvement: 74.6,
          unit: '/100',
          description: 'Measured reduction in unconscious bias indicators'
        },
        processEfficiency: {
          metric: 'Process Efficiency',
          traditional: 68.5,
          aiEnhanced: 89.2,
          improvement: 30.2,
          unit: '%',
          description: 'Automation and streamlining of recruitment processes'
        }
      };

      const mockDecisionData: AIDecisionTracking = {
        totalDecisions: applications?.length || 0,
        aiAssisted: Math.floor((applications?.length || 0) * 0.6),
        traditional: Math.floor((applications?.length || 0) * 0.25),
        hybridApproach: Math.floor((applications?.length || 0) * 0.15),
        successRate: {
          ai: 84.2,
          traditional: 67.8,
          hybrid: 91.5
        }
      };

      setPerformanceData(mockPerformanceData);
      setDecisionData(mockDecisionData);

      toast({
        title: "Metrics Updated",
        description: "AI impact metrics have been refreshed",
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load AI impact metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const formatImprovement = (value: number) => {
    const prefix = value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  const getImprovementColor = (value: number) => {
    if (value > 20) return 'text-green-600';
    if (value > 0) return 'text-green-500';
    if (value > -10) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getImprovementIcon = (value: number) => {
    return value > 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Impact Dashboard</h1>
          <p className="text-muted-foreground">
            Track and compare AI-enhanced vs traditional recruitment metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          <Button onClick={loadMetrics} disabled={loading}>
            {loading ? <Clock className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Refresh Metrics
          </Button>
        </div>
      </div>

      {/* Decision Distribution */}
      {decisionData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Decision Method Distribution
            </CardTitle>
            <CardDescription>
              How hiring decisions are being made across your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {decisionData.aiAssisted}
                </div>
                <div className="text-sm text-muted-foreground mb-1">AI-Assisted</div>
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" />
                  {decisionData.successRate.ai}% Success
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {decisionData.hybridApproach}
                </div>
                <div className="text-sm text-muted-foreground mb-1">Hybrid Approach</div>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" />
                  {decisionData.successRate.hybrid}% Success
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600 mb-2">
                  {decisionData.traditional}
                </div>
                <div className="text-sm text-muted-foreground mb-1">Traditional</div>
                <Badge variant="outline" className="gap-1">
                  <Calculator className="w-3 h-3" />
                  {decisionData.successRate.traditional}% Success
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics Comparison */}
      {performanceData && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(performanceData).map(([key, metric]) => {
            const ImprovementIcon = getImprovementIcon(metric.improvement);
            
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-2 cursor-help">
                          {metric.metric}
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{metric.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Traditional</span>
                      <span className="font-medium">
                        {metric.unit === '$' ? '$' : ''}{metric.traditional}{metric.unit !== '$' ? metric.unit : ''}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">AI-Enhanced</span>
                      <span className="font-medium text-primary">
                        {metric.unit === '$' ? '$' : ''}{metric.aiEnhanced}{metric.unit !== '$' ? metric.unit : ''}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">Improvement</span>
                      <div className={`flex items-center gap-1 ${getImprovementColor(metric.improvement)}`}>
                        <ImprovementIcon className="w-4 h-4" />
                        <span className="font-bold">{formatImprovement(metric.improvement)}</span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.abs(metric.improvement)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI ROI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            AI ROI Summary
          </CardTitle>
          <CardDescription>
            Financial impact of AI implementation in recruitment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">$18,200</div>
              <div className="text-sm text-muted-foreground">Monthly Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">312%</div>
              <div className="text-sm text-muted-foreground">ROI</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">5.8 days</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">94%</div>
              <div className="text-sm text-muted-foreground">User Satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIImpactDashboard;