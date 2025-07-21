
import React from 'react';
import { Users, SquareCode, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalyticsSummaryProps {
  totalApplications: number;
  provider?: string;
}

const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({ totalApplications, provider }) => {
  return (
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
            <p className="text-3xl font-bold text-primary">{totalApplications}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">AI Provider</p>
            <Badge variant="outline" className="gap-1">
              {provider === 'basic' && <><SquareCode className="w-3 h-3" /> Basic</>}
              {provider === 'openai' && <><Brain className="w-3 h-3" /> OpenAI</>}
              {provider === 'anthropic' && <><Brain className="w-3 h-3" /> Claude</>}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsSummary;
