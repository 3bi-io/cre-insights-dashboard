import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, ArrowRight,
  CheckCircle2, Send, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { STAGES, getSourceStyle, getStageConfig } from './stageConfig';
import type { ClientApplication } from '../../hooks/useClientApplications';
import { cn } from '@/lib/utils';

interface ApplicantQuickViewProps {
  application: ClientApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStageChange: (applicationId: string, newStage: string) => void;
}

const ApplicantQuickView: React.FC<ApplicantQuickViewProps> = ({
  application,
  open,
  onOpenChange,
  onStageChange,
}) => {
  if (!application) return null;

  const name = [application.first_name, application.last_name].filter(Boolean).join(' ') || 'Unknown';
  const location = [application.city, application.state].filter(Boolean).join(', ');
  const jobTitle = application.job_listings?.title || application.job_listings?.job_title || 'No position';
  const currentStage = getStageConfig(application.status || 'pending');
  const sourceStyle = getSourceStyle(application.source);
  const score = application.ats_readiness_score;

  const atsStatus = application.tenstreet_sync_status || application.driverreach_sync_status;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Applicant Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-sm text-muted-foreground">{jobTitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              {application.applicant_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{application.applicant_email}</span>
                </div>
              )}
              {application.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{application.phone}</span>
                </div>
              )}
              {location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Stage Progression */}
          <div>
            <h4 className="text-sm font-medium mb-3">Stage Progression</h4>
            <div className="flex items-center gap-1 flex-wrap">
              {STAGES.map((stage, idx) => {
                const isCurrent = stage.id === (application.status || 'pending');
                const currentIdx = STAGES.findIndex(s => s.id === (application.status || 'pending'));
                const isPast = idx < currentIdx;

                return (
                  <React.Fragment key={stage.id}>
                    <button
                      onClick={() => onStageChange(application.id, stage.id)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium transition-all',
                        isCurrent && `${stage.color} text-white`,
                        isPast && 'bg-muted text-foreground',
                        !isCurrent && !isPast && 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {stage.label}
                    </button>
                    {idx < STAGES.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Source</div>
                <Badge className={cn('text-xs', sourceStyle.bg, sourceStyle.text)} variant="secondary">
                  {application.source || 'Unknown'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Applied</div>
                <div className="text-sm font-medium">
                  {application.applied_at
                    ? format(new Date(application.applied_at), 'MMM d, yyyy')
                    : 'N/A'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Readiness Score</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold">{score ?? 'N/A'}</div>
                  {score != null && (
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">ATS Status</div>
                <div className="flex items-center gap-1.5">
                  {atsStatus === 'synced' ? (
                    <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm text-emerald-500">Delivered</span></>
                  ) : atsStatus === 'error' ? (
                    <><span className="w-3.5 h-3.5 text-red-500">⚠</span><span className="text-sm text-red-500">Error</span></>
                  ) : (
                    <><Send className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Pending</span></>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recruiter */}
          {application.recruiters && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Assigned Recruiter</h4>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {application.recruiters.first_name.charAt(0)}{application.recruiters.last_name.charAt(0)}
                  </div>
                  <span className="text-sm">{application.recruiters.first_name} {application.recruiters.last_name}</span>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {application.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{application.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApplicantQuickView;
