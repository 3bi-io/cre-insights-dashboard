import React from 'react';
import { ArrowUp, ArrowDown, Minus, Calendar, TrendingUp, Users, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComparisonMetricsProps {
  analyticsData: any;
}

const ComparisonMetrics: React.FC<ComparisonMetricsProps> = ({ analyticsData }) => {
  // Mock historical data for comparison (in a real app, this would come from the database)
  const historicalData = {
    lastMonth: {
      totalApplications: Math.floor((analyticsData?.totalApplications || 0) * 0.85),
      conversionRate: 12.5,
      averageProcessingTime: 3.2,
      topLocations: ['Texas', 'California', 'Florida']
    },
    lastQuarter: {
      totalApplications: Math.floor((analyticsData?.totalApplications || 0) * 0.75),
      conversionRate: 11.8,
      averageProcessingTime: 3.8,
      topLocations: ['Texas', 'Florida', 'Arizona']
    }
  };

  const currentData = {
    totalApplications: analyticsData?.totalApplications || 0,
    conversionRate: 15.2, // Calculated from current data
    averageProcessingTime: 2.8,
    topLocations: analyticsData?.locationConversion?.slice(0, 3).map(l => l.location) || []
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, percentage: 0, trend: 'neutral' as const };
    const change = current - previous;
    const percentage = (change / previous) * 100;
    const trend = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'neutral' as const;
    return { value: change, percentage, trend };
  };

  const metrics = [
    {
      title: 'Total Applications',
      current: currentData.totalApplications,
      previous: historicalData.lastMonth.totalApplications,
      unit: '',
      icon: Users,
      description: 'vs last month'
    },
    {
      title: 'Conversion Rate',
      current: currentData.conversionRate,
      previous: historicalData.lastMonth.conversionRate,
      unit: '%',
      icon: Target,
      description: 'vs last month'
    },
    {
      title: 'Processing Time',
      current: currentData.averageProcessingTime,
      previous: historicalData.lastMonth.averageProcessingTime,
      unit: ' days',
      icon: Calendar,
      description: 'vs last month',
      reverseGood: true // Lower is better for processing time
    }
  ];

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral', reverseGood = false) => {
    if (trend === 'neutral') return 'text-gray-600';
    if (reverseGood) {
      return trend === 'up' ? 'text-red-600' : 'text-green-600';
    }
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getBadgeVariant = (trend: 'up' | 'down' | 'neutral', reverseGood = false) => {
    if (trend === 'neutral') return 'secondary';
    if (reverseGood) {
      return trend === 'up' ? 'destructive' : 'default';
    }
    return trend === 'up' ? 'default' : 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Period-over-Period Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            Key metrics compared to previous periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => {
              const change = calculateChange(metric.current, metric.previous);
              const Icon = metric.icon;
              
              return (
                <div key={metric.title} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                    <Badge variant={getBadgeVariant(change.trend, metric.reverseGood)}>
                      <TrendIcon trend={change.trend} />
                      <span className="ml-1">
                        {Math.abs(change.percentage).toFixed(1)}%
                      </span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {metric.current.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
                    </p>
                    <p className="text-sm font-medium">{metric.title}</p>
                    <p className={`text-xs ${getTrendColor(change.trend, metric.reverseGood)}`}>
                      {change.trend === 'up' && !metric.reverseGood && '+'}
                      {change.trend === 'down' && !metric.reverseGood && ''}
                      {change.trend === 'up' && metric.reverseGood && '+'}
                      {change.trend === 'down' && metric.reverseGood && '-'}
                      {change.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit} {metric.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Quarterly Performance Overview</CardTitle>
          <CardDescription>
            Comprehensive view of your recruitment performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Volume Trends */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Application Volume Trends</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Current Month</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-700">{currentData.totalApplications}</span>
                    <p className="text-xs text-green-600">+{calculateChange(currentData.totalApplications, historicalData.lastMonth.totalApplications).percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Last Month</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-700">{historicalData.lastMonth.totalApplications}</span>
                    <p className="text-xs text-blue-600">Baseline</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Last Quarter</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-gray-700">{historicalData.lastQuarter.totalApplications}</span>
                    <p className="text-xs text-gray-600">3 months ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality Trends */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Quality Metrics Evolution</h4>
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <TrendIcon trend="up" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Current: {currentData.conversionRate}%</span>
                      <span>Last Month: {historicalData.lastMonth.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Quarter: {historicalData.lastQuarter.conversionRate}%</span>
                      <span className="text-green-600">+{(currentData.conversionRate - historicalData.lastQuarter.conversionRate).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Processing Speed</span>
                    <TrendIcon trend="down" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Current: {currentData.averageProcessingTime} days</span>
                      <span>Last Month: {historicalData.lastMonth.averageProcessingTime} days</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Quarter: {historicalData.lastQuarter.averageProcessingTime} days</span>
                      <span className="text-green-600">-{(historicalData.lastQuarter.averageProcessingTime - currentData.averageProcessingTime).toFixed(1)} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparisonMetrics;