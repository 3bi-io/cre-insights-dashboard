import React, { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Eye, Calendar, Phone, Mail, ExternalLink, User, Briefcase, MapPin, Loader2, PhoneCall, ChevronDown, Shield, Clock, Globe, Code } from 'lucide-react';
import { formatPhoneForDisplay } from '@/utils/phoneNormalizer';
import { useZipCodeLookup } from '@/hooks/useZipCodeLookup';
import { OutboundCallHistory } from '@/components/voice/OutboundCallHistory';
import { ApplicationBackgroundChecks } from '@/features/screening';
import { ActivityTimeline } from '@/features/applications/components/ActivityTimeline';
import { CommunicationHistory } from '@/features/applications/components/CommunicationHistory';
import { 
  getApplicantName, 
  getApplicantEmail, 
  getClientName,
  getJobDisplayTitle 
} from '@/features/applications/utils/applicationFormatters';
import { getAttributionSummary } from '@/features/applications/utils/applicationFormatters';
import { getStatusColor } from '@/features/applications/utils/statusColors';

interface ApplicationDetailsDialogProps {
  application: any;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

const ApplicationDetailsDialog = ({ application, trigger, isOpen, onClose }: ApplicationDetailsDialogProps) => {
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isBGCHistoryOpen, setIsBGCHistoryOpen] = useState(false);
  const [isActivityTimelineOpen, setIsActivityTimelineOpen] = useState(true);
  const [isCommHistoryOpen, setIsCommHistoryOpen] = useState(false);
  const [isAttributionOpen, setIsAttributionOpen] = useState(false);
  const [isRawPayloadOpen, setIsRawPayloadOpen] = useState(false);
  const { city: lookupCity, state: lookupState, isLoading: isLookingUp } = useZipCodeLookup(application.zip);

  // Get city and state with fallback logic
  const displayCity = application.city || lookupCity || 'Not provided';
  const displayState = application.state || lookupState || 'Not provided';

  const customFields = application.custom_fields && typeof application.custom_fields === 'object' 
    ? application.custom_fields as Record<string, unknown>
    : {};

  return (
    <ResponsiveModal open={isOpen ?? false} onOpenChange={(open) => !open && onClose?.()}>
      <ResponsiveModalContent className="max-w-2xl" maxHeight="80vh">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Application Details
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Detailed information about the job application including applicant information, job details, and application status.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        
        <div className="space-y-6">
          {/* Applicant Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Applicant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">First Name</label>
                <p className="text-sm">{application.first_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                <p className="text-sm">{application.last_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(application.status, 'dialog')}>
                    {application.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {getApplicantEmail(application)}
                </p>
              </div>
              {application.phone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    {formatPhoneForDisplay(application.phone)}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">City</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <p className="text-sm">{displayCity}</p>
                  {isLookingUp && application.zip && !application.city && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">State</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <p className="text-sm">{displayState}</p>
                  {isLookingUp && application.zip && !application.state && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                </div>
              </div>
              {application.zip && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ZIP Code</label>
                  <p className="text-sm">{application.zip}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Application ID</label>
                <p className="text-sm font-mono text-xs">{application.id}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Driver/Experience Information */}
          {(application.cdl || application.exp || application.months || application.veteran) && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Driver & Experience Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.cdl && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CDL License</label>
                      <p className="text-sm">{application.cdl}</p>
                    </div>
                  )}
                  {(application.exp || application.months) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Experience</label>
                      <p className="text-sm">
                        {(() => {
                          const months = parseInt(application.months || application.exp || '0');
                          if (months < 3) {
                            return 'Less than 3 months';
                          } else if (months >= 3) {
                            return 'More than 3 months';
                          }
                          return application.exp || 'Not provided';
                        })()}
                      </p>
                    </div>
                  )}
                  {(application.months || application.exp) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Months</label>
                      <p className="text-sm">{application.months || application.exp}</p>
                    </div>
                  )}
                  {application.veteran && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Veteran Status</label>
                      <p className="text-sm">{application.veteran}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Compliance & Agreements */}
          {(application.drug || application.consent || application.privacy || application.age) && (
            <>
              <div>
                <h3 className="text-lg font-semibold mb-3">Compliance & Agreements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.drug && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Drug Screening</label>
                      <p className="text-sm">{application.drug}</p>
                    </div>
                  )}
                  {application.consent && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Data Consent</label>
                      <p className="text-sm">{application.consent}</p>
                    </div>
                  )}
                  {application.privacy && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Privacy Agreement</label>
                      <p className="text-sm">{application.privacy}</p>
                    </div>
                  )}
                  {application.age && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Age Verification</label>
                      <p className="text-sm">{application.age}</p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          <Separator />

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position</label>
                <p className="text-sm">
                  {getJobDisplayTitle(application)}
                </p>
              </div>
              {getClientName(application) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <p className="text-sm">{getClientName(application)}</p>
                </div>
              )}
              {application.job_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">External Job ID</label>
                  <p className="text-sm font-mono text-xs">{application.job_id}</p>
                </div>
              )}
              {application.job_listing_id && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Internal Job Listing ID</label>
                  <p className="text-sm font-mono text-xs">{application.job_listing_id}</p>
                </div>
              )}
              {application.source && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Source</label>
                  <p className="text-sm">{application.source}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Application Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Application Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Applied Date</label>
                <p className="text-sm">
                  {application.applied_at ? new Date(application.applied_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                <p className="text-sm">
                  {application.created_at ? new Date(application.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">
                  {application.updated_at ? new Date(application.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Timeline */}
          <Collapsible open={isActivityTimelineOpen} onOpenChange={setIsActivityTimelineOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Clock className="w-4 h-4" />
                  Activity Timeline
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isActivityTimelineOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ActivityTimeline
                applicationId={application.id}
                showTitle={false}
                maxHeight="300px"
              />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Outbound Call History */}
          <Collapsible open={isCallHistoryOpen} onOpenChange={setIsCallHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <PhoneCall className="w-4 h-4" />
                  Outbound Call History
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCallHistoryOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <OutboundCallHistory
                applicationId={application.id}
                showTitle={false}
                maxHeight="300px"
              />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Background Checks */}
          <Collapsible open={isBGCHistoryOpen} onOpenChange={setIsBGCHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Shield className="w-4 h-4" />
                  Background Checks
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBGCHistoryOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ApplicationBackgroundChecks
                applicationId={application.id}
                applicantName={getApplicantName(application)}
                organizationId={application.job_listings?.organization_id}
                showTitle={false}
              />
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Communication History */}
          <Collapsible open={isCommHistoryOpen} onOpenChange={setIsCommHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent">
                <span className="flex items-center gap-2 text-lg font-semibold">
                  <Mail className="w-4 h-4" />
                  Communication History
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isCommHistoryOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <CommunicationHistory
                applicationId={application.id}
                showTitle={false}
                maxHeight="300px"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Links */}
          {(customFields.resume_url || customFields.linkedin_url || customFields.portfolio_url) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Links</h3>
                <div className="flex gap-2 flex-wrap">
                  {customFields.resume_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => window.open(String(customFields.resume_url), '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Resume
                    </Button>
                  )}
                  {customFields.linkedin_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => window.open(String(customFields.linkedin_url), '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      LinkedIn
                    </Button>
                  )}
                  {customFields.portfolio_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => window.open(String(customFields.portfolio_url), '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Portfolio
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {application.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {application.notes}
                </p>
              </div>
            </>
          )}

          {/* Custom Fields */}
          {Object.keys(customFields).length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(customFields).map(([key, value]) => {
                    if (['resume_url', 'linkedin_url', 'portfolio_url'].includes(key)) return null;
                    return (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default ApplicationDetailsDialog;