import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Calendar, Phone, Mail, ExternalLink, User, Briefcase } from 'lucide-react';

interface ApplicationDetailsDialogProps {
  application: any;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

const ApplicationDetailsDialog = ({ application, trigger, isOpen, onClose }: ApplicationDetailsDialogProps) => {
  const getApplicantName = (app: any) => {
    if (app.full_name) {
      return app.full_name;
    } else if (app.first_name && app.last_name) {
      return `${app.first_name} ${app.last_name}`;
    } else if (app.first_name) {
      return app.first_name;
    } else if (app.last_name) {
      return app.last_name;
    }
    return 'Anonymous Applicant';
  };

  const getApplicantEmail = (app: any) => {
    return app.applicant_email || 'No email provided';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'hired':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (app: any) => {
    return app.job_listings?.clients?.name || app.job_listings?.client || null;
  };

  const getJobTitle = (app: any) => {
    // Prefer fields provided directly by agents/importers
    const direct = app.job_title || app.position || app.title;
    if (direct) return direct;

    // From display_fields (array of { displayPrompt, displayValue })
    if (Array.isArray(app.display_fields)) {
      const match = app.display_fields.find((f: any) =>
        typeof f?.displayPrompt === 'string' && /job\s*title|position/i.test(f.displayPrompt)
      );
      if (match?.displayValue) return match.displayValue;
    }

    // From custom_fields object if present
    if (app.custom_fields && typeof app.custom_fields === 'object') {
      const c = app.custom_fields;
      return c.job_title || c.position || c.title || null;
    }

    // Fallback to linked job listing
    return app.job_listings?.title || app.job_listings?.job_title || null;
  };

  const customFields = application.custom_fields && typeof application.custom_fields === 'object' 
    ? application.custom_fields as any 
    : {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      {!trigger && isOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Details
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="application-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Application Details
          </DialogTitle>
          <div id="application-details-description" className="sr-only">
            Detailed information about the job application including applicant information, job details, and application status.
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Applicant Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Applicant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm">{application.full_name || 'Not provided'}</p>
              </div>
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
                  <Badge className={getStatusColor(application.status)}>
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
                    {application.phone}
                  </p>
                </div>
              )}
              {application.city && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p className="text-sm">{application.city}</p>
                </div>
              )}
              {application.state && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">State</label>
                  <p className="text-sm">{application.state}</p>
                </div>
              )}
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
                  {getJobTitle(application) || 'No job title provided'}
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
                      onClick={() => window.open(customFields.resume_url, '_blank')}
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
                      onClick={() => window.open(customFields.linkedin_url, '_blank')}
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
                      onClick={() => window.open(customFields.portfolio_url, '_blank')}
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
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationDetailsDialog;