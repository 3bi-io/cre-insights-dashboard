
import React from 'react';
import { Target, BarChart3, Calendar, TrendingUp } from 'lucide-react';

interface MetaStatsProps {
  accountsCount: number;
  campaignsCount: number;
  totalSpend: number;
  dataPointsCount: number;
}

const MetaStats: React.FC<MetaStatsProps> = ({ 
  accountsCount, 
  campaignsCount, 
  totalSpend, 
  dataPointsCount 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <Target className="w-6 h-6 mx-auto mb-2 text-blue-500" />
        <div className="text-sm font-medium">Ad Accounts</div>
        <div className="text-2xl font-bold text-blue-600">
          {accountsCount}
        </div>
      </div>
      
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-500" />
        <div className="text-sm font-medium">Campaigns</div>
        <div className="text-2xl font-bold text-green-600">
          {campaignsCount}
        </div>
      </div>
      
      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
        <div className="text-sm font-medium">30d Spend</div>
        <div className="text-2xl font-bold text-purple-600">
          ${totalSpend.toFixed(2)}
        </div>
      </div>

      <div className="text-center p-4 bg-muted/50 rounded-lg">
        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-orange-500" />
        <div className="text-sm font-medium">Data Points</div>
        <div className="text-2xl font-bold text-orange-600">
          {dataPointsCount}
        </div>
      </div>
    </div>
  );
};

export default MetaStats;
