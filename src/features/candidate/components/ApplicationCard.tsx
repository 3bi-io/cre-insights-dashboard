import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, MessageSquare, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ApplicationCardProps {
  application: any;
  onWithdraw?: (params: { applicationId: string; reason?: string }) => void;
  isWithdrawing?: boolean;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    reviewed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    interview_scheduled: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    offer_extended: 'bg-green-500/10 text-green-500 border-green-500/20',
    hired: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    withdrawn: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-500';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pending Review',
    reviewed: 'Reviewed',
    interview_scheduled: 'Interview Scheduled',
    offer_extended: 'Offer Extended',
    hired: 'Hired',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn',
  };
  return labels[status] || status;
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onWithdraw,
  isWithdrawing,
}) => {
  const job = application.job_listings;
  const canWithdraw = !['withdrawn', 'hired', 'rejected'].includes(application.status);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {job?.organizations?.logo_url && (
                <img 
                  src={job.organizations.logo_url} 
                  alt={job.organizations.name}
                  className="h-8 w-8 rounded object-cover"
                />
              )}
              <span className="text-sm text-muted-foreground">
                {job?.organizations?.name}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-1">
              {job?.title}
            </h3>
            <Badge className={getStatusColor(application.status)}>
              {getStatusLabel(application.status)}
            </Badge>
          </div>
          {canWithdraw && onWithdraw && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isWithdrawing}>
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Withdraw Application</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to withdraw your application for {job?.title}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onWithdraw({ applicationId: application.id })}>
                    Withdraw
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {job?.city && job?.state && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.city}, {job.state}
            </div>
          )}
          {application.applied_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        {application.candidate_viewed_at && (
          <p className="text-sm text-muted-foreground">
            Viewed {format(new Date(application.candidate_viewed_at), 'MMM d, yyyy')}
          </p>
        )}

        {application.interview_scheduled_at && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium">Interview Scheduled</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(application.interview_scheduled_at), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>
        )}

        {application.employer_feedback && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Feedback</p>
            <p className="text-sm text-muted-foreground">{application.employer_feedback}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
