import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

interface SourcePerformanceChartProps {
  data: Array<{
    source_name: string;
    application_count: number;
    conversion_rate?: number;
  }>;
  isLoading?: boolean;
  error?: Error | null;
}

export default function SourcePerformanceChart({ 
  data, 
  isLoading = false, 
  error = null 
}: SourcePerformanceChartProps) {
  return (
    <ChartContainer
      title="Application Sources"
      isLoading={isLoading}
      error={error}
      height={350}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="source_name" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar
            dataKey="application_count"
            fill="hsl(var(--primary))"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
