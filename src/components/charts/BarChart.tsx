import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // Responsive margins
  const margins = isMobile 
    ? { top: 5, right: 10, left: 0, bottom: 5 }
    : { top: 5, right: 30, left: 20, bottom: 5 };

  // Responsive height
  const chartHeight = isMobile ? Math.min(height, 280) : height;

  return (
    <ChartContainer
      title={title}
      isLoading={isLoading}
      error={error}
      height={chartHeight}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={margins}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey={xKey} 
            fontSize={isMobile ? 10 : 12}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            interval={isMobile ? 'preserveStartEnd' : 0}
          />
          <YAxis 
            fontSize={isMobile ? 10 : 12}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 35 : 60}
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
              fontSize: isMobile ? '11px' : '12px'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }}
            iconSize={isMobile ? 8 : 14}
          />
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
