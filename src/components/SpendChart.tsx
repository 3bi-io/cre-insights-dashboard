
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const spendData = [
  { date: 'Jan 1', spend: 4200, applications: 85, hires: 12 },
  { date: 'Jan 8', spend: 5100, applications: 102, hires: 18 },
  { date: 'Jan 15', spend: 4800, applications: 96, hires: 15 },
  { date: 'Jan 22', spend: 6200, applications: 124, hires: 22 },
  { date: 'Jan 29', spend: 5800, applications: 116, hires: 19 },
  { date: 'Feb 5', spend: 7100, applications: 142, hires: 28 },
  { date: 'Feb 12', spend: 6800, applications: 136, hires: 25 },
  { date: 'Feb 19', spend: 8200, applications: 164, hires: 32 },
  { date: 'Feb 26', spend: 7600, applications: 152, hires: 29 },
  { date: 'Mar 5', spend: 9100, applications: 182, hires: 38 },
];

const SpendChart = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Advertising Spend Trends</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Weekly Spend</span>
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
                name === 'spend' ? 'Weekly Spend' : name === 'applications' ? 'Applications' : 'Hires'
              ]}
            />
            <Area
              type="monotone"
              dataKey="spend"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#spendGradient)"
            />
            <Line
              type="monotone"
              dataKey="applications"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpendChart;
