import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MessageCircle, Calendar, Phone, ExternalLink, Edit, Mail, MoreVertical, Upload } from 'lucide-react';
import { getApplicantName, getApplicantEmail, getClientName, getApplicantCategory } from '@/utils/applicationHelpers';
import { useIsMobile } from '@/hooks/use-mobile';

interface ApplicationCardProps {
  application: any;
  recruiters?: any[];
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onRecruiterAssignment: (applicationId: string, recruiterId: string | null) => void;
  onSmsOpen: (application: any) => void;
  onDetailsView: (application: any) => void;
  onTenstreetUpdate: (application: any) => void;
}

const ApplicationCard = ({
  application,
  recruiters = [],
  onStatusChange,
  onRecruiterAssignment,
  onSmsOpen,
  onDetailsView,
  onTenstreetUpdate,
}: ApplicationCardProps) => {
  const isMobile = useIsMobile();
  const applicantName = getApplicantName(application);
  const applicantEmail = getApplicantEmail(application);
  const clientName = getClientName(application);
  const category = getApplicantCategory(application);
  const jobTitle = application.job_listings?.title || application.job_listings?.job_title || 'Unknown Position';

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewed: 'bg-blue-100 text-blue-800',
    interviewed: 'bg-purple-100 text-purple-800',
    hired: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-start gap-4`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-white truncate">{applicantName}</h3>
              <Badge className={`${category.color} text-xs`}>
                {category.code}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span className="truncate">{applicantEmail}</span>
              </div>
              <div className="font-medium text-gray-300">{jobTitle}</div>
              {clientName && <div className="text-gray-500">Client: {clientName}</div>}
              {application.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{application.phone}</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Applied: {new Date(application.applied_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className={`flex ${isMobile ? 'w-full' : 'flex-col'} gap-2`}>
            {/* Status Badge and Dropdown */}
            <Select
              value={application.status}
              onValueChange={(value) => onStatusChange(application.id, value)}
            >
              <SelectTrigger className={`${isMobile ? 'flex-1' : 'w-32'} h-8`}>
                <Badge className={statusColors[application.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                  {application.status}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="interviewed">Interviewed</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Recruiter Assignment */}
            <Select
              value={application.recruiter_id || 'unassigned'}
              onValueChange={(value) => onRecruiterAssignment(application.id, value === 'unassigned' ? null : value)}
            >
              <SelectTrigger className={`${isMobile ? 'flex-1' : 'w-40'} h-8 text-xs`}>
                <SelectValue placeholder="Assign recruiter">
                  {application.recruiters 
                    ? `${application.recruiters.first_name} ${application.recruiters.last_name}`
                    : 'Unassigned'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {recruiters.map((recruiter) => (
                  <SelectItem key={recruiter.id} value={recruiter.id}>
                    {recruiter.first_name} {recruiter.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Buttons */}
            <div className={`flex ${isMobile ? 'justify-end' : 'gap-1'}`}>
              {!isMobile ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDetailsView(application)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {application.phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSmsOpen(application)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onTenstreetUpdate(application)}
                    title="Post to Tenstreet"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDetailsView(application)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {application.phone && (
                      <DropdownMenuItem onClick={() => onSmsOpen(application)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        SMS
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onTenstreetUpdate(application)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Post to Tenstreet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;