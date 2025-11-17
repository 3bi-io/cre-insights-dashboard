import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Sparkles, Target, BarChart3, RefreshCw, Check, X, ExternalLink } from 'lucide-react';
import { useJobGroupAI, JobGroupAnalysisType } from '@/hooks/useJobGroupAI';
import { JobGroupSuggestionsView } from './JobGroupSuggestionsView';
import { PublisherRecommendationsView } from './PublisherRecommendationsView';

interface JobGroupAIPanelProps {
  campaignId: string;
  campaignName: string;
  organizationId?: string;
}

export const JobGroupAIPanel: React.FC<JobGroupAIPanelProps> = ({
  campaignId,
  campaignName,
  organizationId,
}) => {
  const { cachedSuggestions, isAnalyzing, analyzeJobGroups, getSuggestionsByStatus } = useJobGroupAI(campaignId, organizationId);
  const [activeTab, setActiveTab] = useState<JobGroupAnalysisType>('suggest_groups');
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);

  const handleAnalyze = async (type: JobGroupAnalysisType) => {
    const result = await analyzeJobGroups(type);
    if (result) {
      setLatestAnalysis(result);
    }
  };

  const pendingSuggestions = getSuggestionsByStatus('pending');
  const acceptedSuggestions = getSuggestionsByStatus('accepted');

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'outline';
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
                AI Job Group Intelligence
                {cachedSuggestions && cachedSuggestions.length > 0 && (
                  <Badge variant={getConfidenceColor(cachedSuggestions[0]?.confidence_score)}>
                    {Math.round((cachedSuggestions[0]?.confidence_score || 0) * 100)}% confidence
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                AI-powered job grouping and publisher recommendations for {campaignName}
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

        {/* Stats */}
        {(pendingSuggestions.length > 0 || acceptedSuggestions.length > 0) && (
          <div className="flex items-center gap-4 mt-4 text-sm">
            {pendingSuggestions.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  {pendingSuggestions.length} pending
                </Badge>
              </div>
            )}
            {acceptedSuggestions.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Check className="w-3 h-3" />
                  {acceptedSuggestions.length} accepted
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JobGroupAnalysisType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="suggest_groups" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Suggest
            </TabsTrigger>
            <TabsTrigger value="optimize_existing" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              Optimize
            </TabsTrigger>
            <TabsTrigger value="publisher_recommendation" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Publishers
            </TabsTrigger>
            <TabsTrigger value="performance_analysis" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggest_groups" className="mt-4">
            {pendingSuggestions.length > 0 ? (
              <JobGroupSuggestionsView suggestions={pendingSuggestions} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No job group suggestions available yet.</p>
                <Button onClick={() => handleAnalyze('suggest_groups')} disabled={isAnalyzing}>
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Suggestions
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="optimize_existing" className="mt-4">
            {latestAnalysis?.analysis_type === 'optimize_existing' ? (
              <div className="space-y-4">
                {latestAnalysis.merge_suggestions && latestAnalysis.merge_suggestions.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Merge Suggestions</h4>
                    <div className="space-y-2">
                      {latestAnalysis.merge_suggestions.map((suggestion: any, idx: number) => (
                        <div key={idx} className="text-sm p-2 bg-muted/50 rounded">
                          {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                
                {latestAnalysis.reassignments && latestAnalysis.reassignments.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3">Recommended Reassignments</h4>
                    <div className="space-y-2">
                      {latestAnalysis.reassignments.map((reassignment: any, idx: number) => (
                        <div key={idx} className="text-sm p-2 bg-muted/50 rounded">
                          <p className="font-medium">Job: {reassignment.job_id}</p>
                          <p className="text-muted-foreground">{reassignment.reason}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No optimization analysis available yet.</p>
                <Button onClick={() => handleAnalyze('optimize_existing')} disabled={isAnalyzing}>
                  <Target className="w-4 h-4 mr-2" />
                  Analyze Optimizations
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="publisher_recommendation" className="mt-4">
            {latestAnalysis?.analysis_type === 'publisher_recommendation' ? (
              <PublisherRecommendationsView recommendations={latestAnalysis.recommendations || []} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No publisher recommendations available yet.</p>
                <Button onClick={() => handleAnalyze('publisher_recommendation')} disabled={isAnalyzing}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get Recommendations
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance_analysis" className="mt-4">
            {latestAnalysis?.analysis_type === 'performance_analysis' ? (
              <div className="space-y-4">
                {latestAnalysis.high_potential && latestAnalysis.high_potential.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-green-500">
                      <Sparkles className="w-4 h-4" />
                      High-Potential Jobs
                    </h4>
                    <div className="space-y-2">
                      {latestAnalysis.high_potential.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm p-2 bg-green-500/10 rounded">
                          {typeof item === 'string' ? item : JSON.stringify(item)}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {latestAnalysis.needs_optimization && latestAnalysis.needs_optimization.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-500">
                      <Target className="w-4 h-4" />
                      Needs Optimization
                    </h4>
                    <div className="space-y-2">
                      {latestAnalysis.needs_optimization.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm p-2 bg-orange-500/10 rounded">
                          {typeof item === 'string' ? item : JSON.stringify(item)}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No performance analysis available yet.</p>
                <Button onClick={() => handleAnalyze('performance_analysis')} disabled={isAnalyzing}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyze Performance
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};