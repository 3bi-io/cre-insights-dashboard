
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PlatformBreakdown = () => {
  const { data: platformData = [], isLoading } = useQuery({
    queryKey: ['platform-breakdown'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_platform_breakdown_data');
      
      if (data && Array.isArray(data)) {
        return data as any[];
      }
      
      return [];
    },
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-md">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value}% of total spend</p>
          <p className="text-sm text-muted-foreground">${data.spend.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Spend by Platform</h3>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (platformData.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Spend by Platform</h3>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          No platform data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Spend by Platform</h3>
      
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
              <span className="text-foreground">{platform.name}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-foreground">${platform.spend.toLocaleString()}</span>
              <span className="text-muted-foreground ml-2">({platform.value}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformBreakdown;
