import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, MapPin, Users, BarChart3, Brain, SquareCode, Settings2, ShieldAlert, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { aiService, AIRequest, AIResponse, AIParameters } from '@/services/aiService';
interface AnalyticsData {
  locationConversion: Array<{
    location: string;
    conversionRate: number;
    totalApplications: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    percentage: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    percentage: number;
    count: number;
  }>;
  insights: string[];
  recommendations: string[];
  totalApplications?: number;
  provider?: string;
}
const AIAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiProvider, setAiProvider] = useState<'basic' | 'openai' | 'anthropic'>('basic');
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const {
    toast
  } = useToast();
  const generateAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch applications data
      const {
        data: applications,
        error
      } = await supabase.from('applications').select('*');
      if (error) throw error;
      console.log(`Fetched ${applications?.length || 0} applications for analysis`);
      setTotalApplications(applications?.length || 0);

      // Call enhanced edge function with selected AI provider
      const {
        data: analysisResult,
        error: analysisError
      } = await supabase.functions.invoke('ai-analytics-enhanced', {
        body: {
          applications,
          aiProvider,
          extraContext: `Analytics for ${applications.length} applications using ${aiProvider} analysis`
        }
      });
      if (analysisError) throw analysisError;

      // Add total applications count to the result
      const enrichedResult = {
        ...analysisResult,
        totalApplications: applications?.length || 0
      };
      setAnalyticsData(enrichedResult);
      toast({
        title: "Analytics Generated",
        description: `AI analysis completed for ${applications?.length || 0} applications using ${aiProvider === 'basic' ? 'Basic' : aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} insights`
      });
    } catch (error) {
      console.error('Error generating analytics:', error);
      toast({
        title: "Error",
        description: "Failed to generate analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Re-generate analytics when provider changes
  useEffect(() => {
    if (analyticsData && aiProvider !== analyticsData.provider) {
      generateAnalytics();
    }
  }, [aiProvider]);
  useEffect(() => {
    generateAnalytics();
  }, []);
  return <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Analytics</h1>
          <p className="text-muted-foreground">
            AI-powered insights and recommendations for your applications
          </p>
          {(analyticsData?.totalApplications || totalApplications > 0) && <p className="text-sm text-primary font-medium mt-1">
              Analyzing {analyticsData?.totalApplications || totalApplications} total applications
            </p>}
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={generateAnalytics} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Refresh Analytics
          </Button>
        </div>
      </div>

      {/* AI Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            AI Analysis Settings
          </CardTitle>
          <CardDescription>
            Choose your preferred AI provider for enhanced insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">AI Provider</label>
              <Select value={aiProvider} onValueChange={(value: 'basic' | 'openai' | 'anthropic') => setAiProvider(value)} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Analysis Options</SelectLabel>
                    <SelectItem value="basic">
                      <div className="flex items-center gap-2">
                        <SquareCode className="w-4 h-4" />
                        <div>
                          <div>Basic Analytics</div>
                          <div className="text-xs text-muted-foreground">Rule-based analysis only</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="openai">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <div>
                          <div>OpenAI GPT-4</div>
                          <div className="text-xs text-muted-foreground">Advanced AI insights & recommendations</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="anthropic">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        <div>
                          <div>Anthropic Claude</div>
                          <div className="text-xs text-muted-foreground">Deep reasoning & strategic analysis</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {aiProvider === 'basic' && <><SquareCode className="w-3 h-3" /> Basic</>}
                {aiProvider === 'openai' && <><Brain className="w-3 h-3" /> OpenAI</>}
                {aiProvider === 'anthropic' && <><Brain className="w-3 h-3" /> Claude</>}
              </Badge>
              {analyticsData?.provider && analyticsData.provider !== aiProvider && <Badge variant="secondary" className="text-xs">
                  Update Required
                </Badge>}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            {aiProvider === 'basic' && "Basic analytics use rule-based analysis to categorize and summarize your application data."}
            {aiProvider === 'openai' && "OpenAI GPT-4 provides advanced pattern recognition and strategic insights for your recruitment data."}
            {aiProvider === 'anthropic' && "Anthropic Claude excels at deep reasoning and provides detailed strategic recommendations."}
          </div>
        </CardContent>
      </Card>

      {loading && !analyticsData ? <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing applications with AI...</p>
          </div>
        </div> : analyticsData ? <>
          {/* Application Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Application Summary
              </CardTitle>
              <CardDescription>
                Total applications processed in this analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications Analyzed</p>
                  <p className="text-3xl font-bold text-primary">{analyticsData.totalApplications || totalApplications}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">AI Provider</p>
                  <Badge variant="outline" className="gap-1">
                    {analyticsData.provider === 'basic' && <><SquareCode className="w-3 h-3" /> Basic</>}
                    {analyticsData.provider === 'openai' && <><Brain className="w-3 h-3" /> OpenAI</>}
                    {analyticsData.provider === 'anthropic' && <><Brain className="w-3 h-3" /> Claude</>}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown (D, SR, SC, N/A) - Full Width */}
          

          <div className="grid gap-6 md:grid-cols-2">
            {/* Location Conversion Rates */}
            

            {/* Status Breakdown */}
            

            {/* AI Insights */}
            <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI Insights
                {analyticsData.provider && <Badge variant="outline" className="ml-2 gap-1 text-xs">
                    {analyticsData.provider === 'basic' && <><SquareCode className="w-3 h-3" /> Basic Analysis</>}
                    {analyticsData.provider === 'openai' && <><Brain className="w-3 h-3" /> GPT-4</>}
                    {analyticsData.provider === 'anthropic' && <><Brain className="w-3 h-3" /> Claude</>}
                  </Badge>}
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
                    {analyticsData.insights.map((insight, index) => <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{insight}</p>
                      </li>)}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-2">
                    {analyticsData.recommendations.map((recommendation, index) => <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                        <p className="text-sm">{recommendation}</p>
                      </li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </> : <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No analytics data available</p>
              <Button onClick={generateAnalytics} className="mt-4">
                Generate Analytics
              </Button>
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default AIAnalytics;