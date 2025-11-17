import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';

interface PredictionData {
  forecast?: any;
  trends?: any[];
  budget_recommendations?: any;
  risks?: string[];
  opportunities?: string[];
}

interface PerformancePredictionProps {
  prediction: PredictionData;
}

export const PerformancePrediction: React.FC<PerformancePredictionProps> = ({
  prediction,
}) => {
  if (!prediction) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prediction data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Forecast */}
      {prediction.forecast && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            30-Day Forecast
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(prediction.forecast).map(([key, value]) => (
              <div key={key}>
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <p className="font-medium mt-1">{String(value)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trends */}
      {prediction.trends && prediction.trends.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-primary" />
            Key Trends
          </h4>
          <div className="space-y-2">
            {prediction.trends.map((trend, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p className="text-sm">{typeof trend === 'string' ? trend : JSON.stringify(trend)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Budget Recommendations */}
      {prediction.budget_recommendations && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Budget Recommendations</h4>
          <div className="text-sm space-y-2">
            {Object.entries(prediction.budget_recommendations).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risks */}
        {prediction.risks && prediction.risks.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-500">
              <AlertTriangle className="w-4 h-4" />
              Risk Factors
            </h4>
            <div className="space-y-2">
              {prediction.risks.map((risk, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{risk}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Opportunities */}
        {prediction.opportunities && prediction.opportunities.length > 0 && (
          <Card className="p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-green-500">
              <Lightbulb className="w-4 h-4" />
              Opportunities
            </h4>
            <div className="space-y-2">
              {prediction.opportunities.map((opp, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{opp}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};