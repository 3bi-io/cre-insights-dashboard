import React from 'react';
import { TrendingUp, Target, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DetailedInsightsProps {
  insights: string[];
  recommendations: string[];
  analyticsData: any;
}

const DetailedInsights: React.FC<DetailedInsightsProps> = ({ 
  insights, 
  recommendations, 
  analyticsData 
}) => {
  // Calculate metrics for comparisons
  const totalApplications = analyticsData?.totalApplications || 0;
  const statusBreakdown = analyticsData?.statusBreakdown || [];
  const categoryBreakdown = analyticsData?.categoryBreakdown || [];
  const locationData = analyticsData?.locationConversion || [];

  // Calculate conversion rates and performance metrics
  const pendingApplications = statusBreakdown.find(s => s.status === 'pending')?.count || 0;
  const approvedApplications = statusBreakdown.find(s => s.status === 'approved')?.count || 0;
  const rejectedApplications = statusBreakdown.find(s => s.status === 'rejected')?.count || 0;
  
  const conversionRate = totalApplications > 0 ? (approvedApplications / totalApplications) * 100 : 0;
  const pendingRate = totalApplications > 0 ? (pendingApplications / totalApplications) * 100 : 0;

  // Get top performing categories
  const experiencedDrivers = categoryBreakdown.find(c => c.category === 'D')?.count || 0;
  const newCDLHolders = categoryBreakdown.find(c => c.category === 'SC')?.count || 0;
  const studentReady = categoryBreakdown.find(c => c.category === 'SR')?.count || 0;

  // Performance benchmarks (industry standards)
  const benchmarks = {
    conversionRate: 15, // 15% is considered good
    pendingRate: 30, // 30% pending is normal
    experiencedDriverPercentage: 40 // 40% experienced drivers is ideal
  };

  const experiencedPercentage = totalApplications > 0 ? (experiencedDrivers / totalApplications) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Analysis
          </CardTitle>
          <CardDescription>
            How your application metrics compare to industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Conversion Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Conversion Rate</span>
                <Badge variant={conversionRate >= benchmarks.conversionRate ? "default" : "secondary"}>
                  {conversionRate >= benchmarks.conversionRate ? "Above Benchmark" : "Below Benchmark"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Rate: {conversionRate.toFixed(1)}%</span>
                  <span>Benchmark: {benchmarks.conversionRate}%</span>
                </div>
                <Progress value={conversionRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {conversionRate >= benchmarks.conversionRate 
                    ? `Excellent! ${(conversionRate - benchmarks.conversionRate).toFixed(1)}% above industry standard`
                    : `${(benchmarks.conversionRate - conversionRate).toFixed(1)}% below industry standard`
                  }
                </p>
              </div>
            </div>

            {/* Application Processing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Efficiency</span>
                <Badge variant={pendingRate <= benchmarks.pendingRate ? "default" : "secondary"}>
                  {pendingRate <= benchmarks.pendingRate ? "Efficient" : "Needs Attention"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pending: {pendingRate.toFixed(1)}%</span>
                  <span>Target: ≤{benchmarks.pendingRate}%</span>
                </div>
                <Progress value={pendingRate} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {pendingRate <= benchmarks.pendingRate 
                    ? "Good processing speed for applications"
                    : `${(pendingRate - benchmarks.pendingRate).toFixed(1)}% more pending than ideal`
                  }
                </p>
              </div>
            </div>

            {/* Experience Quality */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Experience Quality</span>
                <Badge variant={experiencedPercentage >= benchmarks.experiencedDriverPercentage ? "default" : "secondary"}>
                  {experiencedPercentage >= benchmarks.experiencedDriverPercentage ? "High Quality" : "Mixed Quality"}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Experienced: {experiencedPercentage.toFixed(1)}%</span>
                  <span>Target: ≥{benchmarks.experiencedDriverPercentage}%</span>
                </div>
                <Progress value={experiencedPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {experiencedPercentage >= benchmarks.experiencedDriverPercentage 
                    ? "Good mix of experienced drivers"
                    : "Consider targeting more experienced candidates"
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparisons */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Application Quality Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Application Quality Breakdown
            </CardTitle>
            <CardDescription>
              Detailed analysis of applicant categories and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown.map((category) => {
                const details = {
                  'D': { 
                    label: 'Experienced Drivers', 
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    insight: 'High conversion potential, immediate hire candidates'
                  },
                  'SC': { 
                    label: 'New CDL Holders', 
                    icon: Clock,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    insight: 'Good potential with minimal training required'
                  },
                  'SR': { 
                    label: 'Student Ready', 
                    icon: TrendingUp,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    insight: 'Long-term investment, requires CDL training'
                  },
                  'N/A': { 
                    label: 'Uncategorized', 
                    icon: AlertTriangle,
                    color: 'text-gray-600',
                    bgColor: 'bg-gray-50',
                    insight: 'Requires manual review and assessment'
                  }
                };
                
                const detail = details[category.category as keyof typeof details] || details['N/A'];
                const Icon = detail.icon;

                return (
                  <div key={category.category} className={`p-3 rounded-lg ${detail.bgColor}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${detail.color}`} />
                        <span className="font-medium">{detail.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{category.count}</span>
                        <span className="text-sm text-muted-foreground ml-1">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{detail.insight}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Geographic Insights
            </CardTitle>
            <CardDescription>
              Location-based performance and optimization opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationData.slice(0, 5).map((location, index) => {
                const isTopPerformer = index < 2;
                const percentage = totalApplications > 0 ? (location.totalApplications / totalApplications) * 100 : 0;
                
                return (
                  <div key={index} className={`p-3 rounded-lg ${isTopPerformer ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{location.location}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={isTopPerformer ? "default" : "secondary"}>
                          {isTopPerformer ? "Top Performer" : "Standard"}
                        </Badge>
                        <span className="text-sm font-bold">{location.totalApplications}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={percentage} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}% of total applications
                        {isTopPerformer && " - Consider increasing ad spend here"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Advanced analytics and pattern recognition from your application data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Key Insights
              </h4>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                Actionable Recommendations
              </h4>
              <div className="space-y-3">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedInsights;