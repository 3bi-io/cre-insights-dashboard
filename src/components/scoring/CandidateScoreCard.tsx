import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Brain, 
  AlertCircle, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface CandidateScore {
  id: string;
  score: number;
  confidence_level: number;
  score_type: string;
  factors: {
    technical_skills: number;
    experience_match: number;
    education_relevance: number;
    cultural_fit: number;
    communication_skills: number;
    problem_solving: number;
  };
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  created_at: string;
}

interface CandidateScoreCardProps {
  score: CandidateScore;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
}

const CandidateScoreCard: React.FC<CandidateScoreCardProps> = ({ 
  score, 
  onReanalyze,
  isReanalyzing = false 
}) => {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBadgeVariant = (value: number) => {
    if (value >= 80) return 'default';
    if (value >= 60) return 'secondary';
    return 'destructive';
  };

  const formatScoreType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {formatScoreType(score.score_type)} Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated {new Date(score.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getScoreBadgeVariant(score.score)} className="text-sm px-3">
              {score.score}/100
            </Badge>
            {onReanalyze && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReanalyze}
                disabled={isReanalyzing}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isReanalyzing ? 'animate-spin' : ''}`} />
                {isReanalyzing ? 'Analyzing...' : 'Reanalyze'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(score.score)}`}>
              {score.score}%
            </span>
          </div>
          <Progress value={score.score} className="h-2" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>Confidence: {Math.round(score.confidence_level * 100)}%</span>
          </div>
        </div>

        {/* Scoring Factors */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Detailed Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(score.factors).map(([factor, value]) => (
              <div key={factor} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">
                    {factor.replace('_', ' ')}
                  </span>
                  <span className={getScoreColor(value)}>
                    {value}%
                  </span>
                </div>
                <Progress value={value} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Strengths */}
        {score.strengths && score.strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-sm">Strengths</h4>
            </div>
            <ul className="space-y-1">
              {score.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <TrendingUp className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {score.concerns && score.concerns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <h4 className="font-medium text-sm">Areas of Concern</h4>
            </div>
            <ul className="space-y-1">
              {score.concerns.map((concern, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <TrendingDown className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {score.recommendations && score.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-sm">Recommendations</h4>
            </div>
            <ul className="space-y-1">
              {score.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CandidateScoreCard;