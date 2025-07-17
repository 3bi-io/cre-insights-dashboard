import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

interface BarChartProps {
  data: any[];
  title: string;
  xKey: string;
  bars: Array<{
    key: string;
    fill: string;
    name: string;
  }>;
  height?: number;
  stacked?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const CustomBarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  xKey, 
  bars, 
  height = 350, 
  stacked = false,
  className = "",
  isLoading = false,
  error = null
}) => {
  return (
    <ChartContainer
      title={title}
      isLoading={isLoading}
      error={error}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey={xKey} 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (typeof value === 'number' && value >= 1000) {
                return `${(value / 1000).toFixed(1)}k`;
              }
              return value;
            }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={index}
              dataKey={bar.key}
              fill={bar.fill}
              name={bar.name}
              stackId={stacked ? "stack" : undefined}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CustomBarChart;