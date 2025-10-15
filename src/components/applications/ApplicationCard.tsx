import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, MessageCircle, Calendar, Phone, ExternalLink, Edit, Mail, MoreVertical, Upload, MapPin, Loader2, FileCheck } from 'lucide-react';
import { getApplicantName, getApplicantEmail, getClientName, getApplicantCategory } from '@/utils/applicationHelpers';
import { formatPhoneForDisplay } from '@/utils/phoneNormalizer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useZipCodeLookup } from '@/hooks/useZipCodeLookup';
import type { Application, Recruiter } from '@/types/common.types';

interface ApplicationCardProps {
  application: Application;
  recruiters?: Recruiter[];
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onRecruiterAssignment: (applicationId: string, recruiterId: string | null) => void;
  onSmsOpen: (application: Application) => void;
  onDetailsView: (application: Application) => void;
  onTenstreetUpdate: (application: Application) => void;
  onScreeningOpen: (application: Application) => void;
}

const ApplicationCard = ({
  application,
  recruiters = [],
  onStatusChange,
  onRecruiterAssignment,
  onSmsOpen,
  onDetailsView,
  onTenstreetUpdate,
  onScreeningOpen,
}: ApplicationCardProps) => {
  const isMobile = useIsMobile();
  const { city: lookupCity, state: lookupState, isLoading: isLookingUp } = useZipCodeLookup(application.zip);
  
  const applicantName = getApplicantName(application);
  const applicantEmail = getApplicantEmail(application);
  const clientName = getClientName(application);
  const category = getApplicantCategory(application);
  const jobTitle = application.job_listings?.title || application.job_listings?.job_title || 'Unknown Position';

  // Get city and state with fallback logic
  const displayCity = application.city || lookupCity;
  const displayState = application.state || lookupState;
  
  // Format location as "City, ST" or fallback
  const formatLocation = () => {
    if (displayCity && displayState) {
      return `${displayCity}, ${displayState}`;
    } else if (displayCity) {
      return displayCity;
    } else if (displayState) {
      return displayState;
    } else if (isLookingUp && application.zip) {
      return (
        <div className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Looking up...
        </div>
      );
    } else {
      return 'No location provided';
    }
  };

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    interviewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    hired: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Card className="group hover:shadow-lg hover:scale-[1.01] transition-all duration-300 border-border/40 hover:border-primary/30 bg-card/50 backdrop-blur-sm animate-fade-in">
      <CardContent className="p-6">
        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} items-start gap-6`}>
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                <span className="text-lg font-bold text-primary">
                  {applicantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-xl text-foreground truncate group-hover:text-primary transition-colors">{applicantName}</h3>
                  <Badge variant="outline" className={`${category.color} text-xs px-2 py-0.5 border`}>
                    {category.code}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">{jobTitle}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{applicantEmail}</span>
              </div>
              {application.phone && (
                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{formatPhoneForDisplay(application.phone)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{formatLocation()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">{new Date(application.applied_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            {clientName && (
              <div className="text-sm px-3 py-1.5 rounded-md bg-accent/50 text-accent-foreground inline-block">
                Client: {clientName}
              </div>
            )}
          </div>

          <div className={`flex ${isMobile ? 'w-full flex-row' : 'flex-col'} gap-3`}>
            {/* Status Badge and Dropdown */}
            <Select
              value={application.status}
              onValueChange={(value) => onStatusChange(application.id, value)}
            >
              <SelectTrigger className={`${isMobile ? 'flex-1' : 'w-40'} h-10 border-2`}>
                <Badge variant="outline" className={`${statusColors[application.status as keyof typeof statusColors]} font-medium`}>
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
              <SelectTrigger className={`${isMobile ? 'flex-1' : 'w-40'} h-10 text-sm`}>
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
            <div className={`flex ${isMobile ? 'w-full justify-end' : 'gap-2'}`}>
              {!isMobile ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-scale"
                    onClick={() => onDetailsView(application)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {application.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover-scale"
                      onClick={() => onSmsOpen(application)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-scale"
                    onClick={() => onScreeningOpen(application)}
                    title="Screening Requests"
                  >
                    <FileCheck className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover-scale"
                    onClick={() => onTenstreetUpdate(application)}
                    title="Post to Tenstreet"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
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
                    <DropdownMenuItem onClick={() => onScreeningOpen(application)}>
                      <FileCheck className="w-4 h-4 mr-2" />
                      Screening Requests
                    </DropdownMenuItem>
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