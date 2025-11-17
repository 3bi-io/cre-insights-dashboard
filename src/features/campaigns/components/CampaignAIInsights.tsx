import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Target, BarChart3, Sparkles, RefreshCw } from 'lucide-react';
import { useCampaignAI, CampaignAnalysisType } from '@/hooks/useCampaignAI';
import { OptimizationRecommendations } from './OptimizationRecommendations';
import { PerformancePrediction } from './PerformancePrediction';

interface CampaignAIInsightsProps {
  campaignId: string;
  campaignName: string;
}

export const CampaignAIInsights: React.FC<CampaignAIInsightsProps> = ({
  campaignId,
  campaignName,
}) => {
  const { cachedAnalysis, isAnalyzing, analyzeCampaign, getAnalysisByType } = useCampaignAI(campaignId);
  const [activeTab, setActiveTab] = useState<CampaignAnalysisType>('performance');

  const handleAnalyze = async (type: CampaignAnalysisType) => {
    await analyzeCampaign(type);
  };

  const performanceData = getAnalysisByType('performance');
  const optimizationData = getAnalysisByType('optimization');
  const predictionData = getAnalysisByType('prediction');
  const publisherData = getAnalysisByType('publisher_comparison');

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'outline';
  };

  const renderInsights = (insights: any) => {
    if (!insights) return null;

    // Handle different insight formats
    if (Array.isArray(insights)) {
      return (
        <div className="space-y-2">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </div>
      );
    }

    if (insights.insights && Array.isArray(insights.insights)) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            {insights.insights.map((insight: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{insight}</p>
              </div>
            ))}
          </div>

          {insights.strengths && insights.strengths.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Strengths
              </h4>
              <div className="space-y-1">
                {insights.strengths.map((strength: string, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground pl-6">• {strength}</p>
                ))}
              </div>
            </div>
          )}

          {insights.weaknesses && insights.weaknesses.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                Areas for Improvement
              </h4>
              <div className="space-y-1">
                {insights.weaknesses.map((weakness: string, idx: number) => (
                  <p key={idx} className="text-sm text-muted-foreground pl-6">• {weakness}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <pre className="text-xs overflow-auto">{JSON.stringify(insights, null, 2)}</pre>;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Campaign Insights
                {cachedAnalysis && cachedAnalysis.length > 0 && (
                  <Badge variant={getConfidenceColor(cachedAnalysis[0]?.confidence_score)}>
                    {Math.round((cachedAnalysis[0]?.confidence_score || 0) * 100)}% confidence
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                AI-powered analysis and recommendations for {campaignName}
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAnalyze(activeTab)}
            disabled={isAnalyzing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CampaignAnalysisType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="performance" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="optimization" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="prediction" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Forecast
            </TabsTrigger>
            <TabsTrigger value="publisher_comparison" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Publishers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-4 space-y-4">
            {performanceData ? (
              renderInsights(performanceData.insights)
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No performance analysis available yet.</p>
                <Button onClick={() => handleAnalyze('performance')} disabled={isAnalyzing}>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Performance
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimization" className="mt-4">
            {optimizationData ? (
              <OptimizationRecommendations
                recommendations={
                  typeof optimizationData.insights === 'object' && optimizationData.insights !== null && 'recommendations' in optimizationData.insights
                    ? (optimizationData.insights as any).recommendations
                    : Array.isArray(optimizationData.recommendations) 
                      ? optimizationData.recommendations as any[]
                      : []
                }
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No optimization recommendations available yet.</p>
                <Button onClick={() => handleAnalyze('optimization')} disabled={isAnalyzing}>
                  <Target className="w-4 h-4 mr-2" />
                  Generate Recommendations
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="prediction" className="mt-4">
            {predictionData ? (
              <PerformancePrediction 
                prediction={
                  typeof predictionData.insights === 'object' && predictionData.insights !== null
                    ? predictionData.insights as any
                    : predictionData as any
                } 
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No predictions available yet.</p>
                <Button onClick={() => handleAnalyze('prediction')} disabled={isAnalyzing}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Generate Forecast
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="publisher_comparison" className="mt-4">
            {publisherData ? (
              <div className="space-y-4">
                {renderInsights(publisherData.insights)}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No publisher comparison available yet.</p>
                <Button onClick={() => handleAnalyze('publisher_comparison')} disabled={isAnalyzing}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Compare Publishers
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};