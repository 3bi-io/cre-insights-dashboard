import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, MapPin, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  locationConversion: Array<{ location: string; conversionRate: number; totalApplications: number }>;
  statusBreakdown: Array<{ status: string; percentage: number; count: number }>;
  categoryBreakdown: Array<{ category: string; percentage: number; count: number }>;
  insights: string[];
  recommendations: string[];
}

const AIAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch applications data
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*');

      if (error) throw error;

      // Call edge function to analyze with OpenAI
      const { data: analysisResult, error: analysisError } = await supabase.functions
        .invoke('ai-analytics', {
          body: { applications }
        });

      if (analysisError) throw analysisError;

      setAnalyticsData(analysisResult);
      toast({
        title: "Analytics Generated",
        description: "AI analysis completed successfully",
      });
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAnalytics();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights and recommendations for your applications
          </p>
        </div>
        <Button onClick={generateAnalytics} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
          Refresh Analytics
        </Button>
      </div>

      {loading && !analyticsData ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing applications with AI...</p>
          </div>
        </div>
      ) : analyticsData ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Location Conversion Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Best Conversion Locations
              </CardTitle>
              <CardDescription>
                Locations with highest application conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.locationConversion.map((location, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{location.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {location.totalApplications} applications
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {location.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Application Status Breakdown
              </CardTitle>
              <CardDescription>
                Distribution of application statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.statusBreakdown.map((status, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{status.status}</p>
                      <p className="text-sm text-muted-foreground">
                        {status.count} applications
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {status.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown (D, SR, SC, N/A) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Category Distribution
              </CardTitle>
              <CardDescription>
                D, SR, SC, N/A category breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {category.count} applications
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        {category.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <p><strong>D:</strong> CDL holders with 48+ months experience</p>
                <p><strong>SR:</strong> Senior experienced (48+ months)</p>
                <p><strong>SC:</strong> Semi-experienced candidates</p>
                <p><strong>N/A:</strong> No experience or missing data</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Insights
              </CardTitle>
              <CardDescription>
                Key insights discovered from your application data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Insights:</h4>
                  <ul className="space-y-2">
                    {analyticsData.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-2">
                    {analyticsData.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No analytics data available</p>
              <Button onClick={generateAnalytics} className="mt-4">
                Generate Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAnalytics;