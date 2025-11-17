import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, AlertTriangle } from 'lucide-react';

interface PublisherRecommendation {
  job_ids: string[];
  primary_publisher: string;
  secondary_publishers: string[];
  avoid_publishers: string[];
  reasoning: string;
  expected_metrics?: any;
}

interface PublisherRecommendationsViewProps {
  recommendations: PublisherRecommendation[];
}

export const PublisherRecommendationsView: React.FC<PublisherRecommendationsViewProps> = ({
  recommendations,
}) => {
  const getPublisherColor = (publisher: string) => {
    const colors: Record<string, string> = {
      'Indeed': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'Indeed Premium': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Facebook': 'bg-blue-600/10 text-blue-600 border-blue-600/20',
      'LinkedIn': 'bg-blue-700/10 text-blue-700 border-blue-700/20',
      'Google Jobs': 'bg-red-500/10 text-red-500 border-red-500/20',
      'Craigslist': 'bg-purple-600/10 text-purple-600 border-purple-600/20',
      'ZipRecruiter': 'bg-green-500/10 text-green-500 border-green-500/20',
      'CareerBuilder': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };
    return colors[publisher] || 'bg-muted text-muted-foreground border-muted';
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No publisher recommendations available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, idx) => (
        <Card key={idx} className="p-4">
          <div className="space-y-4">
            {/* Primary Publisher */}
            <div>
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Primary Recommendation
              </h5>
              <Badge className={`${getPublisherColor(rec.primary_publisher)} border`}>
                <ExternalLink className="w-3 h-3 mr-1" />
                {rec.primary_publisher}
              </Badge>
            </div>

            {/* Secondary Publishers */}
            {rec.secondary_publishers && rec.secondary_publishers.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Alternative Options</h5>
                <div className="flex flex-wrap gap-2">
                  {rec.secondary_publishers.map((pub, pidx) => (
                    <Badge key={pidx} variant="outline" className={getPublisherColor(pub)}>
                      {pub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid Publishers */}
            {rec.avoid_publishers && rec.avoid_publishers.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2 text-orange-500">
                  <AlertTriangle className="w-4 h-4" />
                  Not Recommended
                </h5>
                <div className="flex flex-wrap gap-2">
                  {rec.avoid_publishers.map((pub, pidx) => (
                    <Badge key={pidx} variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                      {pub}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reasoning */}
            {rec.reasoning && (
              <div className="p-3 bg-muted/50 rounded text-sm">
                <p className="font-medium mb-1">Reasoning:</p>
                <p className="text-muted-foreground">{rec.reasoning}</p>
              </div>
            )}

            {/* Expected Metrics */}
            {rec.expected_metrics && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded text-sm">
                <p className="font-medium mb-2">Expected Performance:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(rec.expected_metrics).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="ml-2 font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job Count */}
            <div className="text-xs text-muted-foreground">
              Applies to {rec.job_ids?.length || 0} job{(rec.job_ids?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};