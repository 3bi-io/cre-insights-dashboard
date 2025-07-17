import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

interface AreaChartProps {
  data: any[];
  title: string;
  xKey: string;
  areas: Array<{
    key: string;
    fill: string;
    stroke: string;
    name: string;
  }>;
  height?: number;
  stacked?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const CustomAreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  xKey,
  areas,
  height = 350,
  stacked = true,
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
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          {areas.map((area, index) => (
            <Area
              key={index}
              type="monotone"
              dataKey={area.key}
              stackId={stacked ? "stack" : area.key}
              stroke={area.stroke}
              fill={area.fill}
              name={area.name}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CustomAreaChart;