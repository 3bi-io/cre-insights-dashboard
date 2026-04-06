import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, ArrowRight,
  CheckCircle2, Send, ExternalLink, Shield, Truck, XCircle,
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
                {(() => {
                  const upstream = (application.raw_payload as Record<string, unknown>)?.source as string | undefined;
                  if (upstream && upstream !== application.source) {
                    return (
                      <div className="text-[11px] text-muted-foreground mt-1">
                        via {upstream}
                      </div>
                    );
                  }
                  return null;
                })()}
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

          {/* Experience */}
          {(application.cdl_class || application.driving_experience_years != null || (application.cdl_endorsements && application.cdl_endorsements.length > 0) || application.cdl || application.exp) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> Experience
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(application.cdl_class || (!application.cdl_class && application.cdl)) && (
                    <div>
                      <span className="text-muted-foreground text-xs">{application.cdl_class ? 'CDL Class' : 'CDL'}</span>
                      <p className="font-medium">{application.cdl_class || application.cdl}</p>
                    </div>
                  )}
                  {application.cdl_state && (
                    <div>
                      <span className="text-muted-foreground text-xs">CDL State</span>
                      <p className="font-medium">{application.cdl_state}</p>
                    </div>
                  )}
                  {application.cdl_expiration_date && (
                    <div>
                      <span className="text-muted-foreground text-xs">CDL Expires</span>
                      <p className="font-medium">{format(new Date(application.cdl_expiration_date), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  {(application.driving_experience_years != null || (!application.driving_experience_years && application.exp)) && (
                    <div>
                      <span className="text-muted-foreground text-xs">Experience</span>
                      <p className="font-medium">
                        {application.driving_experience_years != null
                          ? `${application.driving_experience_years} yr${application.driving_experience_years !== 1 ? 's' : ''}`
                          : application.exp}
                      </p>
                    </div>
                  )}
                  {application.veteran && (
                    <div>
                      <span className="text-muted-foreground text-xs">Veteran</span>
                      <p className="font-medium">{application.veteran}</p>
                    </div>
                  )}
                </div>
                {application.cdl_endorsements && application.cdl_endorsements.length > 0 && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-xs">Endorsements</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {application.cdl_endorsements.map((e) => (
                        <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Compliance */}
          {(application.can_pass_drug_test || application.can_pass_physical || application.background_check_consent || application.violation_history || application.accident_history || application.convicted_felony || application.dot_physical_date || application.hazmat_endorsement || application.twic_card) && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Compliance
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {application.can_pass_drug_test && (
                    <div className="flex items-center gap-1.5">
                      {application.can_pass_drug_test.toLowerCase() === 'yes' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span>Drug Test</span>
                    </div>
                  )}
                  {application.can_pass_physical && (
                    <div className="flex items-center gap-1.5">
                      {application.can_pass_physical.toLowerCase() === 'yes' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span>Physical</span>
                    </div>
                  )}
                  {application.background_check_consent && (
                    <div className="flex items-center gap-1.5">
                      {application.background_check_consent.toLowerCase() === 'yes' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span>Background Check</span>
                    </div>
                  )}
                  {application.convicted_felony && (
                    <div className="flex items-center gap-1.5">
                      {application.convicted_felony.toLowerCase() === 'no' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      <span>No Felony</span>
                    </div>
                  )}
                  {application.hazmat_endorsement && (
                    <div className="flex items-center gap-1.5">
                      {application.hazmat_endorsement.toLowerCase() === 'yes' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span>HAZMAT</span>
                    </div>
                  )}
                  {application.twic_card && (
                    <div className="flex items-center gap-1.5">
                      {application.twic_card.toLowerCase() === 'yes' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-muted-foreground" />}
                      <span>TWIC Card</span>
                    </div>
                  )}
                </div>
                {(application.dot_physical_date || application.medical_card_expiration) && (
                  <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                    {application.dot_physical_date && (
                      <div>
                        <span className="text-muted-foreground text-xs">DOT Physical</span>
                        <p className="font-medium">{format(new Date(application.dot_physical_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                    {application.medical_card_expiration && (
                      <div>
                        <span className="text-muted-foreground text-xs">Medical Card Exp</span>
                        <p className="font-medium">{format(new Date(application.medical_card_expiration), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </div>
                )}
                {application.violation_history && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-xs">Violations</span>
                    <p className="text-sm mt-0.5">{application.violation_history}</p>
                  </div>
                )}
                {application.accident_history && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-xs">Accidents</span>
                    <p className="text-sm mt-0.5">{application.accident_history}</p>
                  </div>
                )}
                {application.felony_details && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-xs">Felony Details</span>
                    <p className="text-sm mt-0.5">{application.felony_details}</p>
                  </div>
                )}
              </div>
            </>
          )}

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
