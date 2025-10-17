import { Card } from '@/components/ui/card';
import { Users, Clock, TrendingUp, CheckCircle } from 'lucide-react';

interface ApplicationsStatsProps {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  hiredCount: number;
}

export const ApplicationsStats = ({
  totalCount,
  pendingCount,
  inProgressCount,
  hiredCount,
}: ApplicationsStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Applications</p>
            <p className="text-2xl font-bold">{totalCount}</p>
          </div>
          <Users className="w-8 h-8 text-primary" />
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
          <Clock className="w-8 h-8 text-warning" />
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold">{inProgressCount}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Hired</p>
            <p className="text-2xl font-bold">{hiredCount}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
      </Card>
    </div>
  );
};
