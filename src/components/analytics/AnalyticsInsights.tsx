
import React from 'react';
import { TrendingUp, SquareCode, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalyticsInsightsProps {
  insights: string[];
  recommendations: string[];
  provider?: string;
}

const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({ insights, recommendations, provider }) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          AI Insights
          {provider && (
            <Badge variant="outline" className="ml-2 gap-1 text-xs">
              {provider === 'basic' && <><SquareCode className="w-3 h-3" /> Basic Analysis</>}
              {provider === 'openai' && <><Brain className="w-3 h-3" /> GPT-4</>}
              {provider === 'anthropic' && <><Brain className="w-3 h-3" /> Claude</>}
            </Badge>
          )}
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
              {insights.map((insight, index) => (
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
              {recommendations.map((recommendation, index) => (
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
  );
};

export default AnalyticsInsights;
