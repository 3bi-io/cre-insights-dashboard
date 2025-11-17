import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, Zap } from 'lucide-react';

interface Recommendation {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'hard';
  timeline?: string;
}

interface OptimizationRecommendationsProps {
  recommendations: Recommendation[];
}

export const OptimizationRecommendations: React.FC<OptimizationRecommendationsProps> = ({
  recommendations,
}) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'low': return 'text-blue-500 bg-blue-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recommendations available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => (
        <Card key={idx} className="p-4 hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-2 flex-1">
              <Target className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-medium mb-1">{rec.title}</h4>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            </div>
            <Badge className={getImpactColor(rec.impact)}>
              {rec.impact} impact
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className={`w-3 h-3 ${getDifficultyColor(rec.difficulty)}`} />
              <span className="capitalize">{rec.difficulty}</span>
            </div>
            {rec.timeline && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{rec.timeline}</span>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};