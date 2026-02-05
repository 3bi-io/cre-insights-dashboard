import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, MessageSquare, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ApplicationProgress } from './ApplicationProgress';
import { getStatusColor, getStatusLabel } from '@/features/applications/utils/statusColors';
 import { CompanyLogo } from '@/components/shared';
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

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onWithdraw,
  isWithdrawing,
}) => {
  const job = application.job_listings;
  const canWithdraw = !['withdrawn', 'hired', 'rejected'].includes(application.status);

  // Calculate display title: show client name for "General Application" jobs
  const displayTitle = useMemo(() => {
    if (!job) return 'Unknown Position';
    
    const title = job.title || job.job_title;
    if (!title) return 'Unknown Position';
    
    // For "General Application" jobs, display client name if available
    if (title.toLowerCase().includes('general application')) {
      const clientName = job.clients?.name;
      return clientName || title;
    }
    
    return title;
  }, [job]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
               <CompanyLogo
                 logoUrl={job?.clients?.logo_url}
                 companyName={job?.clients?.name || 'Company'}
                 size="sm"
               />
              <div className="min-w-0">
                <h3 className="text-lg font-semibold truncate">{displayTitle}</h3>
                <p className="text-sm text-muted-foreground truncate">
                   {job?.clients?.name || 'Company'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={getStatusColor(application.status, 'candidate')}>
              {getStatusLabel(application.status)}
            </Badge>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Stepper */}
        <div className="py-2 overflow-x-auto">
          <ApplicationProgress status={application.status} />
        </div>

        {/* Details */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {job?.city && job?.state && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {job.city}, {job.state}
            </div>
          )}
          {application.applied_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        {/* Interview Scheduled */}
        {application.interview_scheduled_at && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm font-medium text-primary">Interview Scheduled</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(application.interview_scheduled_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}

        {/* Employer Feedback */}
        {application.employer_feedback && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium mb-1">Employer Feedback</p>
            <p className="text-sm text-muted-foreground">{application.employer_feedback}</p>
          </div>
        )}

        {/* Viewed indicator */}
        {application.candidate_viewed_at && (
          <p className="text-xs text-muted-foreground">
            Your application was viewed {format(new Date(application.candidate_viewed_at), 'MMM d, yyyy')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to="/my-jobs/messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/my-jobs/job/${job?.id}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Job
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
