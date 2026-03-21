import { Card } from '@/components/ui/card';
import { Users, Clock, TrendingUp, CheckCircle, XCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplicationsStatsProps {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  hiredCount: number;
  rejectedCount?: number;
  reviewedCount?: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  borderColor: string;
}

const StatCard = ({ label, value, icon: Icon, accentColor, borderColor }: StatCardProps) => (
  <Card className={cn(
    "p-4 border-l-4 transition-all duration-200 hover:shadow-md",
    borderColor
  )}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold mt-0.5">{value}</p>
      </div>
      <div className={cn("p-2.5 rounded-lg", accentColor)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </Card>
);

export const ApplicationsStats = ({
  totalCount,
  pendingCount,
  inProgressCount,
  hiredCount,
  rejectedCount = 0,
  reviewedCount = 0,
}: ApplicationsStatsProps) => {
  const stats: StatCardProps[] = [
    {
      label: 'Total Applications',
      value: totalCount,
      icon: Users,
      accentColor: 'bg-blue-500/15 text-blue-400',
      borderColor: 'border-l-blue-500',
    },
    {
      label: 'Pending Review',
      value: pendingCount,
      icon: Clock,
      accentColor: 'bg-slate-500/15 text-slate-400',
      borderColor: 'border-l-slate-500',
    },
    {
      label: 'Reviewed',
      value: reviewedCount,
      icon: Eye,
      accentColor: 'bg-blue-500/15 text-blue-400',
      borderColor: 'border-l-blue-400',
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      icon: TrendingUp,
      accentColor: 'bg-amber-500/15 text-amber-400',
      borderColor: 'border-l-amber-500',
    },
    {
      label: 'Hired',
      value: hiredCount,
      icon: CheckCircle,
      accentColor: 'bg-emerald-500/15 text-emerald-400',
      borderColor: 'border-l-emerald-500',
    },
    {
      label: 'Rejected',
      value: rejectedCount,
      icon: XCircle,
      accentColor: 'bg-red-500/15 text-red-400',
      borderColor: 'border-l-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
};
