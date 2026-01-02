import React, { useState } from 'react';
import { useCandidateApplications } from '../hooks';
import { ApplicationCard } from '../components';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MyApplicationsPage = () => {
  const { applications, isLoading, error, withdrawApplication, isWithdrawing } = useCandidateApplications();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApplications = applications?.filter((app: any) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['pending', 'reviewed', 'interview_scheduled'].includes(app.status);
    if (statusFilter === 'completed') return ['hired', 'rejected', 'withdrawn'].includes(app.status);
    return app.status === statusFilter;
  });

  const statusCounts = {
    all: applications?.length || 0,
    active: applications?.filter((app: any) => ['pending', 'reviewed', 'interview_scheduled'].includes(app.status)).length || 0,
    completed: applications?.filter((app: any) => ['hired', 'rejected', 'withdrawn'].includes(app.status)).length || 0,
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load applications. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of all your job applications
        </p>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList className="flex w-full overflow-x-auto scrollbar-hide">
          <TabsTrigger value="all" className="flex-1 min-w-fit">
            All ({statusCounts.all})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1 min-w-fit">
            Active ({statusCounts.active})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 min-w-fit">
            Completed ({statusCounts.completed})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredApplications && filteredApplications.length > 0 ? (
        <div className="space-y-4">
          {filteredApplications.map((application: any) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onWithdraw={withdrawApplication}
              isWithdrawing={isWithdrawing}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {statusFilter === 'all' ? 'No applications yet' : `No ${statusFilter} applications`}
          </h3>
          <p className="text-muted-foreground mb-6">
            {statusFilter === 'all' 
              ? 'Start applying to jobs to see them here'
              : `You don't have any ${statusFilter} applications at the moment`}
          </p>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsPage;
