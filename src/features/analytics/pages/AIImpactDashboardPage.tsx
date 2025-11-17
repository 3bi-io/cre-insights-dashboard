import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  Bot,
  Zap,
  BarChart3,
  Loader2
} from 'lucide-react';

import { PageLayout } from '@/features/shared';
import { useAIImpactMetrics } from '@/hooks/useAIImpactMetrics';

const AIImpactDashboardPage = () => {
  const { data: metrics, isLoading, error } = useAIImpactMetrics(30);

  if (isLoading) {
    return (
      <PageLayout 
        title="AI Impact Dashboard" 
        description="Measure the impact of AI on your recruitment operations"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (error || !metrics) {
    return (
      <PageLayout 
        title="AI Impact Dashboard" 
        description="Measure the impact of AI on your recruitment operations"
      >
        <div className="p-6 max-w-7xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Unable to load AI impact metrics. Please try again later.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="AI Impact Dashboard" 
      description="Measure the impact of AI on your recruitment operations"
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInteractions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +25% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avgResponseTime}s</div>
              <p className="text-xs text-muted-foreground">
                -15% faster than baseline
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.satisfactionRate}%</div>
              <Progress value={metrics.satisfactionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.automationSavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Estimated monthly savings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Impact Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                AI Automation Impact
              </CardTitle>
              <CardDescription>
                How AI is improving your recruitment efficiency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Application Screening</span>
                  <Badge variant="outline">{metrics.automationBreakdown.screening}% Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Initial Candidate Contact</span>
                  <Badge variant="outline">{metrics.automationBreakdown.initialContact}% Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">FAQ Resolution</span>
                  <Badge variant="outline">{metrics.automationBreakdown.faqResolution}% Automated</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Performance Improvements
              </CardTitle>
              <CardDescription>
                Key performance improvements from AI implementation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Response Time Improvement</span>
                    <span className="text-sm font-medium">{metrics.performanceImprovements.responseTime}% faster</span>
                  </div>
                  <Progress value={metrics.performanceImprovements.responseTime} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Application Processing</span>
                    <span className="text-sm font-medium">{metrics.performanceImprovements.applicationProcessing}% faster</span>
                  </div>
                  <Progress value={metrics.performanceImprovements.applicationProcessing} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Candidate Engagement</span>
                    <span className="text-sm font-medium">{metrics.performanceImprovements.candidateEngagement}% increase</span>
                  </div>
                  <Progress value={metrics.performanceImprovements.candidateEngagement} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>AI Usage Trends</CardTitle>
            <CardDescription>
              Detailed analytics and trends in AI system usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Detailed AI usage trends and analytics visualization coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AIImpactDashboardPage;