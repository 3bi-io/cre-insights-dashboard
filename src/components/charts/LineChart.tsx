import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

interface LineChartProps {
  data: any[];
  title: string;
  xKey: string;
  lines: Array<{
    key: string;
    stroke: string;
    name: string;
  }>;
  height?: number;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const CustomLineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  xKey, 
  lines, 
  height = 350,
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
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.key}
              stroke={line.stroke}
              name={line.name}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CustomLineChart;