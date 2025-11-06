import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

interface ApplicationTrendsChartProps {
  data: Array<{
    date: string;
    applications: number;
  }>;
  isLoading?: boolean;
  error?: Error | null;
}

export default function ApplicationTrendsChart({ 
  data, 
  isLoading = false, 
  error = null 
}: ApplicationTrendsChartProps) {
  return (
    <ChartContainer
      title="Daily Application Trends"
      isLoading={isLoading}
      error={error}
      height={350}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
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
          <Line
            type="monotone"
            dataKey="applications"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
