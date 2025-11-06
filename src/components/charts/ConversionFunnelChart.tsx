import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import ChartContainer from './ChartContainer';

const mockFunnelData = [
  { stage: 'Applied', count: 500, color: '#3b82f6' },
  { stage: 'Screened', count: 350, color: '#8b5cf6' },
  { stage: 'Interviewed', count: 150, color: '#ec4899' },
  { stage: 'Offered', count: 75, color: '#f59e0b' },
  { stage: 'Hired', count: 50, color: '#10b981' }
];

export default function ConversionFunnelChart() {
  return (
    <ChartContainer
      title="Candidate Conversion Funnel"
      isLoading={false}
      error={null}
      height={350}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={mockFunnelData} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            type="category"
            dataKey="stage" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            type="number"
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
            formatter={(value: number, name: string, props: any) => [
              `${value} applicants`,
              props.payload.stage
            ]}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
          >
            {mockFunnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
