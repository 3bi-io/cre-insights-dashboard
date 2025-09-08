import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MetricsCardProps } from '@/types/common.types';

// Memoized MetricsCard for better performance
export const MemoizedMetricsCard = React.memo<MetricsCardProps>(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = '' 
}) => (
  <Card className={className}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {trend && (
        <p className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.isPositive ? '+' : ''}{trend.value}% from last month
        </p>
      )}
    </CardContent>
  </Card>
));

MemoizedMetricsCard.displayName = 'MemoizedMetricsCard';

// Memoized Badge component
export const MemoizedBadge = React.memo<{
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}>(({ children, variant = 'default', className }) => (
  <Badge variant={variant} className={className}>
    {children}
  </Badge>
));

MemoizedBadge.displayName = 'MemoizedBadge';

// Memoized Button component for frequently used buttons
export const MemoizedButton = React.memo<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}>(({ children, onClick, variant = 'default', size = 'default', disabled, className, type = 'button' }) => (
  <Button
    onClick={onClick}
    variant={variant}
    size={size}
    disabled={disabled}
    className={className}
    type={type}
  >
    {children}
  </Button>
));

MemoizedButton.displayName = 'MemoizedButton';

// Memoized loading state component
export const MemoizedSkeleton = React.memo<{
  className?: string;
  count?: number;
}>(({ className = 'h-4 w-full', count = 1 }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`animate-pulse bg-muted rounded ${className}`} />
    ))}
  </>
));

MemoizedSkeleton.displayName = 'MemoizedSkeleton';

// Memoized error state component
export const MemoizedErrorState = React.memo<{
  message?: string;
  onRetry?: () => void;
}>(({ message = 'Something went wrong', onRetry }) => (
  <Card className="p-6 text-center">
    <CardContent>
      <CardDescription className="mb-4">{message}</CardDescription>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </CardContent>
  </Card>
));

MemoizedErrorState.displayName = 'MemoizedErrorState';