import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Calendar, Phone, Mail, ExternalLink, User, Briefcase } from 'lucide-react';

interface ApplicationDetailsDialogProps {
  application: any;
  trigger?: React.ReactNode;
}

const ApplicationDetailsDialog = ({ application, trigger }: ApplicationDetailsDialogProps) => {
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

  const customFields = application.custom_fields && typeof application.custom_fields === 'object' 
    ? application.custom_fields as any 
    : {};

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Application Details
          </DialogTitle>
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
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{getApplicantName(application)}</p>
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
            </div>
          </div>

          <Separator />

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Position</label>
                <p className="text-sm">
                  {application.job_listings?.title || application.job_listings?.job_title || 'No job title provided'}
                </p>
              </div>
              {application.job_listings?.platforms?.name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform</label>
                  <p className="text-sm">{application.job_listings.platforms.name}</p>
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
                  {new Date(application.applied_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">
                  {new Date(application.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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