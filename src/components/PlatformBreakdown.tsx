
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const platformData = [
  { name: 'Indeed', value: 35, spend: 12250, color: '#3b82f6' },
  { name: 'LinkedIn', value: 25, spend: 8750, color: '#10b981' },
  { name: 'ZipRecruiter', value: 20, spend: 7000, color: '#f59e0b' },
  { name: 'Glassdoor', value: 12, spend: 4200, color: '#ef4444' },
  { name: 'Monster', value: 8, spend: 2800, color: '#8b5cf6' },
];

const PlatformBreakdown = () => {
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
