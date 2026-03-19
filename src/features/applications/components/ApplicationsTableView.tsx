import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  MessageCircle, 
  Upload, 
  FileCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { getApplicantName, getApplicantEmail, getClientName, getApplicantCategory, getFormType } from '@/utils/applicationHelpers';
import { getJobDisplayTitle } from '@/features/applications/utils/applicationFormatters';
import { formatPhoneForDisplay } from '@/utils/phoneNormalizer';
import { useZipCodeLookup } from '@/hooks/useZipCodeLookup';
import type { Application, Recruiter } from '@/types/common.types';
import { TableSortHeader, SortDirection } from './TableSortHeader';
import type { ColumnVisibility } from './TableColumnVisibility';

interface ApplicationsTableViewProps {
  applications: Application[];
  recruiters?: Recruiter[];
  selectedApplications: Set<string>;
  columnVisibility: ColumnVisibility;
  onStatusChange: (applicationId: string, newStatus: string) => void;
  onRecruiterAssignment: (applicationId: string, recruiterId: string | null) => void;
  onSmsOpen: (application: Application) => void;
  onDetailsView: (application: Application) => void;
  onTenstreetUpdate: (application: Application) => void;
  onScreeningOpen: (application: Application) => void;
  onSelectApplication: (applicationId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

const LocationCell = ({ application }: { application: Application }) => {
  const { city: lookupCity, state: lookupState, isLoading: isLookingUp } = useZipCodeLookup(application.zip);
  
  const displayCity = application.city || lookupCity;
  const displayState = application.state || lookupState;
  
  if (isLookingUp && application.zip) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }
  
  if (displayCity && displayState) {
    return <span className="text-sm">{displayCity}, {displayState}</span>;
  } else if (displayCity) {
    return <span className="text-sm">{displayCity}</span>;
  } else if (displayState) {
    return <span className="text-sm">{displayState}</span>;
  }
  
  return <span className="text-xs text-muted-foreground">No location</span>;
};

export const ApplicationsTableView: React.FC<ApplicationsTableViewProps> = ({
  applications,
  recruiters = [],
  selectedApplications,
  columnVisibility,
  onStatusChange,
  onRecruiterAssignment,
  onSmsOpen,
  onDetailsView,
  onTenstreetUpdate,
  onScreeningOpen,
  onSelectApplication,
  onSelectAll,
}) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    follow_up: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    reviewed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    interviewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    hired: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedApplications = useMemo(() => {
    if (!sortKey || !sortDirection) return applications;

    return [...applications].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortKey) {
        case 'name':
          aValue = getApplicantName(a).toLowerCase();
          bValue = getApplicantName(b).toLowerCase();
          break;
        case 'job':
          aValue = (a.job_listings?.title || a.job_listings?.job_title || '').toLowerCase();
          bValue = (b.job_listings?.title || b.job_listings?.job_title || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.applied_at).getTime();
          bValue = new Date(b.applied_at).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'location':
          aValue = `${a.city || ''} ${a.state || ''}`.toLowerCase();
          bValue = `${b.city || ''} ${b.state || ''}`.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [applications, sortKey, sortDirection]);

  const allSelected = applications.length > 0 && applications.every(app => selectedApplications.has(app.id));
  const someSelected = applications.some(app => selectedApplications.has(app.id)) && !allSelected;

  return (
    <div className="border rounded-lg bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all"
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
              {columnVisibility.applicant && (
                <TableHead className="w-[200px]">
                  <TableSortHeader
                    label="Applicant"
                    sortKey="name"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
              )}
              {columnVisibility.job && (
                <TableHead className="w-[180px]">
                  <TableSortHeader
                    label="Job"
                    sortKey="job"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
              )}
              {columnVisibility.contact && <TableHead className="w-[140px]">Contact</TableHead>}
              {columnVisibility.location && (
                <TableHead className="w-[120px]">
                  <TableSortHeader
                    label="Location"
                    sortKey="location"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
              )}
              {columnVisibility.date && (
                <TableHead className="w-[100px]">
                  <TableSortHeader
                    label="Date"
                    sortKey="date"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
              )}
              {columnVisibility.status && (
                <TableHead className="w-[140px]">
                  <TableSortHeader
                    label="Status"
                    sortKey="status"
                    currentSortKey={sortKey}
                    currentSortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </TableHead>
              )}
              {columnVisibility.recruiter && <TableHead className="w-[160px]">Recruiter</TableHead>}
              {columnVisibility.actions && <TableHead className="w-[200px] text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedApplications.map((application) => {
              const applicantName = getApplicantName(application);
              const applicantEmail = getApplicantEmail(application);
              const clientName = getClientName(application);
              const category = getApplicantCategory(application);
              const jobTitle = getJobDisplayTitle(application);

              return (
                <TableRow 
                  key={application.id}
                  className="hover:bg-muted/50 border-border/40"
                >
                  {/* Checkbox */}
                  <TableCell>
                    <Checkbox
                      checked={selectedApplications.has(application.id)}
                      onCheckedChange={(checked) => onSelectApplication(application.id, checked as boolean)}
                      aria-label={`Select ${applicantName}`}
                    />
                  </TableCell>

                  {/* Applicant */}
                  {columnVisibility.applicant && (
                    <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {applicantName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{applicantName}</div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <Badge variant="outline" className={`${category.color} text-xs px-1 py-0 border`}>
                            {category.code}
                          </Badge>
                          {getFormType(application) === 'Detailed' ? (
                            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs px-1 py-0 border hover:bg-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" />
                              Detailed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs px-1 py-0 border">
                              Quick
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    </TableCell>
                  )}

                  {/* Job */}
                  {columnVisibility.job && (
                    <TableCell>
                    <div className="text-sm font-medium truncate">{jobTitle}</div>
                    {clientName && (
                      <div className="text-xs text-muted-foreground truncate">{clientName}</div>
                    )}
                    </TableCell>
                  )}

                  {/* Contact */}
                  {columnVisibility.contact && (
                    <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]" title={applicantEmail}>{applicantEmail}</span>
                      </div>
                      {application.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{formatPhoneForDisplay(application.phone)}</span>
                        </div>
                      )}
                    </div>
                    </TableCell>
                  )}

                  {/* Location */}
                  {columnVisibility.location && (
                    <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <LocationCell application={application} />
                    </div>
                    </TableCell>
                  )}

                  {/* Date */}
                  {columnVisibility.date && (
                    <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{new Date(application.applied_at).toLocaleDateString()}</span>
                    </div>
                    </TableCell>
                  )}

                  {/* Status */}
                  {columnVisibility.status && (
                    <TableCell>
                    <Select
                      value={application.status}
                      onValueChange={(value) => onStatusChange(application.id, value)}
                    >
                      <SelectTrigger className="h-8 border-2 w-full">
                        <Badge 
                          variant="outline" 
                          className={`${statusColors[application.status as keyof typeof statusColors]} text-xs font-medium`}
                        >
                          {application.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    </TableCell>
                  )}

                  {/* Recruiter */}
                  {columnVisibility.recruiter && (
                    <TableCell>
                    <Select
                      value={application.recruiter_id || 'unassigned'}
                      onValueChange={(value) => onRecruiterAssignment(application.id, value === 'unassigned' ? null : value)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full">
                        <SelectValue placeholder="Unassigned">
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
                    </TableCell>
                  )}

                  {/* Actions */}
                  {columnVisibility.actions && (
                    <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onDetailsView(application)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {application.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onSmsOpen(application)}
                          title="SMS"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onScreeningOpen(application)}
                        title="Screening Requests"
                      >
                        <FileCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onTenstreetUpdate(application)}
                        title="Post to Tenstreet"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
