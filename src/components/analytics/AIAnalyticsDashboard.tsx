import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  BarChart3, 
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useCandidateScoring } from '@/hooks/useCandidateScoring';
import CandidateRankingTable from '@/components/scoring/CandidateRankingTable';
import CandidateScoreCard from '@/components/scoring/CandidateScoreCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface CandidateRankingWithApplication {
  id: string;
  rank_position: number;
  overall_score: number;
  match_percentage: number;
  applications: {
    id: string;
    first_name: string;
    last_name: string;
    applicant_email: string;
    phone: string;
    applied_at: string;
    status: string;
  };
}

interface AIAnalyticsDashboardProps {
  jobListingId?: string;
  applicationId?: string;
}

const AIAnalyticsDashboard: React.FC<AIAnalyticsDashboardProps> = ({
  jobListingId,
  applicationId
}) => {
  const { useJobRankings, useApplicationScores, runAnalysis, bulkAnalyze, isAnalyzing, isBulkAnalyzing } = useCandidateScoring();
  
  // Fetch data based on props
  const { data: rawRankings = [], isLoading: rankingsLoading } = useJobRankings(jobListingId || '');
  const { data: scores = [], isLoading: scoresLoading } = useApplicationScores(applicationId || '');
  
  // Transform rankings data 
  const rankings = rawRankings || [];

  // Calculate analytics metrics
  const analyticMetrics = React.useMemo(() => {
    if (jobListingId && rankings.length > 0) {
      const totalCandidates = rankings.length;
      const avgScore = rankings.reduce((sum, r) => sum + r.overall_score, 0) / totalCandidates;
      const topPerformers = rankings.filter(r => r.overall_score >= 80).length;
      const qualifiedCandidates = rankings.filter(r => r.match_percentage >= 70).length;
      
      return {
        totalCandidates,
        avgScore: Math.round(avgScore),
        topPerformers,
        qualifiedCandidates,
        qualificationRate: Math.round((qualifiedCandidates / totalCandidates) * 100)
      };
    }
    
    return {
      totalCandidates: 0,
      avgScore: 0,
      topPerformers: 0,
      qualifiedCandidates: 0,
      qualificationRate: 0
    };
  }, [rankings, jobListingId]);

  // Score distribution data for charts
  const scoreDistribution = React.useMemo(() => {
    if (rankings.length === 0) return [];
    
    const ranges = [
      { name: '90-100', min: 90, max: 100, count: 0, color: '#22c55e' },
      { name: '80-89', min: 80, max: 89, count: 0, color: '#84cc16' },
      { name: '70-79', min: 70, max: 79, count: 0, color: '#eab308' },
      { name: '60-69', min: 60, max: 69, count: 0, color: '#f97316' },
      { name: 'Below 60', min: 0, max: 59, count: 0, color: '#ef4444' },
    ];
    
    rankings.forEach(ranking => {
      const range = ranges.find(r => ranking.overall_score >= r.min && ranking.overall_score <= r.max);
      if (range) range.count++;
    });
    
    return ranges.filter(r => r.count > 0);
  }, [rankings]);

  // Top skills analysis
  const skillsAnalysis = React.useMemo(() => {
    if (scores.length === 0) return [];
    
    const skillData = [
      { name: 'Technical Skills', value: 0, count: 0 },
      { name: 'Experience Match', value: 0, count: 0 },
      { name: 'Cultural Fit', value: 0, count: 0 },
      { name: 'Communication', value: 0, count: 0 },
      { name: 'Problem Solving', value: 0, count: 0 },
    ];
    
    scores.forEach(score => {
      if (score.factors) {
        skillData[0].value += score.factors.technical_skills || 0;
        skillData[0].count++;
        skillData[1].value += score.factors.experience_match || 0;
        skillData[1].count++;
        skillData[2].value += score.factors.cultural_fit || 0;
        skillData[2].count++;
        skillData[3].value += score.factors.communication_skills || 0;
        skillData[3].count++;
        skillData[4].value += score.factors.problem_solving || 0;
        skillData[4].count++;
      }
    });
    
    return skillData.map(skill => ({
      ...skill,
      value: skill.count > 0 ? Math.round(skill.value / skill.count) : 0
    }));
  }, [scores]);

  const handleBulkAnalyze = () => {
    if (jobListingId && rankings.length > 0) {
      const applicationIds = rankings.map(r => r.application_id);
      bulkAnalyze({ jobListingId, applicationIds });
    }
  };

  if (jobListingId) {
    // Job-level analytics view
    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Candidates</p>
                  <p className="text-2xl font-bold">{analyticMetrics.totalCandidates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">{analyticMetrics.avgScore}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Top Performers</p>
                  <p className="text-2xl font-bold">{analyticMetrics.topPerformers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                  <p className="text-2xl font-bold">{analyticMetrics.qualificationRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <Button 
                onClick={handleBulkAnalyze} 
                disabled={isBulkAnalyzing || rankings.length === 0}
                className="w-full"
              >
                <Brain className="w-4 h-4 mr-2" />
                {isBulkAnalyzing ? 'Analyzing...' : 'Analyze All'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rankings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
            <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rankings" className="space-y-4">
            <CandidateRankingTable 
              rankings={rankings as unknown as CandidateRankingWithApplication[]} 
              isLoading={rankingsLoading}
            />
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={scoreDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, count }) => `${name}: ${count}`}
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Candidate Quality Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Average Skills Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={skillsAnalysis} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  if (applicationId && scores.length > 0) {
    // Application-level scores view
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">AI Analysis Results</h2>
          <Badge variant="outline">
            {scores.length} analysis{scores.length !== 1 ? 'es' : ''}
          </Badge>
        </div>

        <div className="grid gap-6">
          {scores.map((score) => (
            <CandidateScoreCard 
              key={score.id} 
              score={score}
              onReanalyze={() => runAnalysis({
                applicationId,
                jobListingId: '', // You'd need to pass this in
                analysisType: score.score_type as any
              })}
              isReanalyzing={isAnalyzing}
            />
          ))}
        </div>

        {scores.length === 0 && !scoresLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No AI Analysis Available</h3>
                <p className="text-muted-foreground mb-4">
                  Run AI analysis to get detailed candidate insights and scoring.
                </p>
                <Button onClick={() => runAnalysis({
                  applicationId,
                  jobListingId: '', // You'd need to pass this in
                  analysisType: 'overall'
                })}>
                  <Brain className="w-4 h-4 mr-2" />
                  Run AI Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default empty state
  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            Select a job listing or application to view AI-powered insights.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAnalyticsDashboard;