import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Bot, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  totalInteractions: number;
  pendingReview: number;
  autoResponseRate: number;
  avgResponseTime: number;
  todayInteractions: number;
  activeConnections: number;
  isLoading?: boolean;
}

export function QuickStats({
  totalInteractions,
  pendingReview,
  autoResponseRate,
  avgResponseTime,
  todayInteractions,
  activeConnections,
  isLoading,
}: QuickStatsProps) {
  const stats = [
    {
      title: 'Total Interactions',
      value: totalInteractions,
      subtitle: 'Last 30 days',
      icon: MessageSquare,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Pending Review',
      value: pendingReview,
      subtitle: 'Needs attention',
      icon: AlertTriangle,
      variant: pendingReview > 0 ? 'warning' : 'default',
    },
    {
      title: 'Auto-Response Rate',
      value: `${autoResponseRate}%`,
      subtitle: 'Handled by AI',
      icon: Bot,
      progress: autoResponseRate,
    },
    {
      title: 'Avg Response Time',
      value: formatResponseTime(avgResponseTime),
      subtitle: 'First response',
      icon: Clock,
    },
    {
      title: "Today's Activity",
      value: todayInteractions,
      subtitle: 'Interactions today',
      icon: Zap,
    },
    {
      title: 'Active Platforms',
      value: `${activeConnections}/5`,
      subtitle: 'Connected',
      icon: Users,
      progress: (activeConnections / 5) * 100,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title}
          className={cn(
            "transition-all hover:shadow-md",
            stat.variant === 'warning' && pendingReview > 0 && "border-amber-500/50 bg-amber-500/5"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={cn(
              "h-4 w-4",
              stat.variant === 'warning' && pendingReview > 0 ? "text-amber-500" : "text-muted-foreground"
            )} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className={cn(
                "text-2xl font-bold",
                stat.variant === 'warning' && pendingReview > 0 && "text-amber-600"
              )}>
                {stat.value}
              </div>
              {stat.trend && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    stat.trendUp ? "text-green-600 bg-green-500/10" : "text-red-600 bg-red-500/10"
                  )}
                >
                  {stat.trend}
                </Badge>
              )}
            </div>
            {stat.progress !== undefined && (
              <Progress value={stat.progress} className="h-1 mt-2" />
            )}
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatResponseTime(minutes: number): string {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
