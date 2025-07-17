import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

interface PieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
}

const CustomPieChart: React.FC<PieChartProps> = ({
  data,
  title,
  height = 350,
  innerRadius = 0,
  outerRadius = 80,
  className = "",
  isLoading = false,
  error = null
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border rounded-lg p-2 shadow-md">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Value: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer
      title={title}
      isLoading={isLoading}
      error={error}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default CustomPieChart;