import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
}

const CustomAreaChart: React.FC<AreaChartProps> = ({ 
  data, 
  title, 
  xKey, 
  areas, 
  height = 300,
  stacked = false,
  className = ""
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {areas.map((area, index) => (
              <Area
                key={index}
                type="monotone"
                dataKey={area.key}
                stroke={area.stroke}
                fill={area.fill}
                name={area.name}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CustomAreaChart;