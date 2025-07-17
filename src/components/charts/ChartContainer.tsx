import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  isLoading: boolean;
  error: Error | null;
  height?: number;
  className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  isLoading,
  error,
  height = 350,
  className = ""
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load chart data: {error.message}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div 
            className="flex items-center justify-center bg-muted animate-pulse rounded-lg"
            style={{ height }}
          >
            <div className="text-muted-foreground">Loading chart...</div>
          </div>
        ) : (
          <div style={{ height }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartContainer;