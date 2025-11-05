import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, MessageSquare, Eye, Send, FileText } from 'lucide-react';
import { getApplicantName, getApplicantEmail } from '@/utils/applicationHelpers';
import type { Application } from '@/types/common.types';

interface ApplicationsTableProps {
  applications: Application[];
  statusCounts: Record<string, number>;
  selectedApplications: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectApplication: (id: string, checked: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  onSmsOpen: (app: Application) => void;
  onDetailsView: (app: Application) => void;
  onTenstreetUpdate: (app: Application) => void;
  onScreeningOpen: (app: Application) => void;
}

const STATUS_TABS = ['all', 'pending', 'reviewed', 'interviewing', 'hired', 'rejected'] as const;

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  interviewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  hired: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const ApplicationsTable = ({
  applications,
  statusCounts,
  selectedApplications,
  onSelectAll,
  onSelectApplication,
  onStatusChange,
  onSmsOpen,
  onDetailsView,
  onTenstreetUpdate,
  onScreeningOpen,
}: ApplicationsTableProps) => {
  const getFilteredApplications = (status: typeof STATUS_TABS[number]) => {
    return status === 'all' 
      ? applications 
      : applications.filter(app => app.status === status);
  };

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList className="grid w-full grid-cols-6">
        {STATUS_TABS.map((status) => (
          <TabsTrigger key={status} value={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status] || applications.length})
          </TabsTrigger>
        ))}
      </TabsList>

      {STATUS_TABS.map((status) => {
        const filteredApps = getFilteredApplications(status);
        
        return (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredApps.length > 0 ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedApplications.size === filteredApps.length}
                          onCheckedChange={onSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Applied</TableHead>
                      <TableHead>Recruiter</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedApplications.has(application.id)}
                            onCheckedChange={(checked) => 
                              onSelectApplication(application.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {getApplicantName(application)}
                        </TableCell>
                        <TableCell>
                          <a 
                            href={`mailto:${getApplicantEmail(application)}`}
                            className="text-primary hover:underline"
                          >
                            {getApplicantEmail(application)}
                          </a>
                        </TableCell>
                        <TableCell>
                          {application.phone ? (
                            <a 
                              href={`tel:${application.phone}`}
                              className="text-primary hover:underline"
                            >
                              {application.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {application.job_listings?.title || application.job_listings?.job_title || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary"
                            className={STATUS_COLORS[application.status as keyof typeof STATUS_COLORS] || ''}
                          >
                            {application.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {application.city && application.state 
                            ? `${application.city}, ${application.state}`
                            : application.city || application.state || '—'
                          }
                        </TableCell>
                        <TableCell>
                          {application.applied_at 
                            ? new Date(application.applied_at).toLocaleDateString()
                            : '—'
                          }
                        </TableCell>
                        <TableCell>
                          {application.recruiters 
                            ? `${application.recruiters.first_name} ${application.recruiters.last_name}`
                            : <span className="text-muted-foreground">Unassigned</span>
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDetailsView(application)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSmsOpen(application)}
                              title="Send SMS"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onTenstreetUpdate(application)}
                              title="Update Tenstreet"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onScreeningOpen(application)}
                              title="Screening Requests"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No applications found</p>
                  <p className="text-sm">Try adjusting your filters or search criteria</p>
                </div>
              </Card>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};
