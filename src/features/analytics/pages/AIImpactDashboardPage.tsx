import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  Bot,
  Zap,
  BarChart3 
} from 'lucide-react';

import { PageLayout } from '@/features/shared';

const AIImpactDashboardPage = () => {
  // Mock data - replace with actual AI impact metrics
  const metrics = {
    totalInteractions: 1247,
    avgResponseTime: 0.8,
    satisfactionRate: 94,
    automationSavings: 15200
  };

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
                  <Badge variant="outline">87% Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Initial Candidate Contact</span>
                  <Badge variant="outline">94% Automated</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">FAQ Resolution</span>
                  <Badge variant="outline">91% Automated</Badge>
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
                    <span className="text-sm font-medium">75% faster</span>
                  </div>
                  <Progress value={75} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Application Processing</span>
                    <span className="text-sm font-medium">60% faster</span>
                  </div>
                  <Progress value={60} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Candidate Engagement</span>
                    <span className="text-sm font-medium">45% increase</span>
                  </div>
                  <Progress value={45} />
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