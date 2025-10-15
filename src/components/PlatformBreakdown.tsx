
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/services/loggerService';

const PlatformBreakdown = () => {
  const { data: platformData = [], isLoading, refetch } = useQuery({
    queryKey: ['platform-breakdown'],
    queryFn: async () => {
      logger.debug('Fetching platform breakdown data', undefined, 'PlatformBreakdown');
      
      const { data: spendData, error } = await supabase
        .from('daily_spend')
        .select(`
          amount,
          job_listings!inner(
            job_platform_associations!inner(
              platforms!inner(name)
            )
          )
        `);

      if (error) {
        logger.error('Error fetching platform breakdown', error, 'PlatformBreakdown');
        throw error;
      }

      logger.debug('Platform breakdown data fetched', { count: spendData?.length }, 'PlatformBreakdown');

      if (!spendData) return [];

      // Group spend by platform
      const platformSpend = spendData.reduce((acc: Record<string, number>, item) => {
        item.job_listings.job_platform_associations.forEach((assoc: any) => {
          const platformName = assoc.platforms.name;
          acc[platformName] = (acc[platformName] || 0) + Number(item.amount);
        });
        return acc;
      }, {});

      const totalSpend = Object.values(platformSpend).reduce((sum, amount) => sum + amount, 0);
      
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      
      return Object.entries(platformSpend).map(([name, spend], index) => ({
        name,
        value: totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0,
        spend,
        color: colors[index % colors.length]
      }));
    },
    // Refresh every 30 seconds
    refetchInterval: 30000,
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.value}% of total spend</p>
          <p className="text-sm text-gray-600">${data.spend.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Spend by Platform</h3>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (platformData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Spend by Platform</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No platform data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Spend by Platform</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={platformData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {platformData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        {platformData.map((platform, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: platform.color }}
              ></div>
              <span className="text-gray-700">{platform.name}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-gray-900">${platform.spend.toLocaleString()}</span>
              <span className="text-gray-500 ml-2">({platform.value}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformBreakdown;
