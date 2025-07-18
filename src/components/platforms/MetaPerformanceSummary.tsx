
import React from 'react';

interface MetaPerformanceSummaryProps {
  totalImpressions: number;
  totalClicks: number;
}

const MetaPerformanceSummary: React.FC<MetaPerformanceSummaryProps> = ({ 
  totalImpressions, 
  totalClicks 
}) => {
  const ctr = totalClicks > 0 ? ((totalClicks / totalImpressions) * 100) : 0;

  return (
    <div className="pt-4 border-t">
      <p className="text-sm font-medium mb-2">30-Day Performance Summary:</p>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-bold">{totalImpressions.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Impressions</p>
        </div>
        <div>
          <p className="text-lg font-bold">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Clicks</p>
        </div>
        <div>
          <p className="text-lg font-bold">{ctr.toFixed(2)}%</p>
          <p className="text-xs text-muted-foreground">CTR</p>
        </div>
      </div>
    </div>
  );
};

export default MetaPerformanceSummary;
