
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SpendChart = () => {
  const { data: spendData = [], isLoading, refetch } = useQuery({
    queryKey: ['spend-chart'],
    queryFn: async () => {
      console.log('Fetching spend chart data...');
      
      // Get daily spend data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: dailySpend, error } = await supabase
        .from('daily_spend')
        .select(`
          date,
          amount,
          job_listings!inner(
            applications(id)
          )
        `)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date');

      if (error) {
        console.error('Error fetching spend chart data:', error);
        throw error;
      }

      console.log('Spend chart data fetched:', dailySpend?.length);

      if (!dailySpend) return [];

      // Group by date and calculate totals
      const groupedData = dailySpend.reduce((acc: Record<string, any>, item) => {
        const date = item.date;
        if (!acc[date]) {
          acc[date] = {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            spend: 0,
            applications: 0,
            hires: 0 // We don't have hire data yet, so this will be 0
          };
        }
        acc[date].spend += Number(item.amount);
        acc[date].applications += item.job_listings.applications.length;
        return acc;
      }, {});

      return Object.values(groupedData).slice(-14); // Last 14 data points
    },
    // Refresh every 30 seconds
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Advertising Spend Trends</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Daily Spend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Applications</span>
            </div>
          </div>
        </div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (spendData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Advertising Spend Trends</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Daily Spend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Applications</span>
            </div>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No spend data available for the last 30 days
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Advertising Spend Trends</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Daily Spend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Applications</span>
          </div>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spendData}>
            <defs>
              <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any, name: string) => [
                name === 'spend' ? `$${value}` : value,
                name === 'spend' ? 'Daily Spend' : name === 'applications' ? 'Applications' : 'Hires'
              ]}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#spendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendChart;
