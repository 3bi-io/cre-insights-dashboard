import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlatformAccess } from '@/hooks/usePlatformAccess';
import PageLayout from '@/features/shared/components/PageLayout';
import { useApplications } from '../hooks/useApplications';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useApplicationDialogs } from '../hooks/useApplicationDialogs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Download, 
  Filter, 
  MoreVertical,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ApplicationCard from '@/components/applications/ApplicationCard';
import ApplicationDetailsDialog from '@/components/applications/ApplicationDetailsDialog';
import SmsConversationDialog from '@/components/applications/SmsConversationDialog';
import TenstreetUpdateModal from '@/components/applications/TenstreetUpdateModal';
import ScreeningRequestsDialog from '@/components/applications/ScreeningRequestsDialog';
import { generateApplicationsPDF } from '@/utils/pdfGenerator';
import { filterApplications, getStatusCounts, getCategoryCounts } from '@/utils/applicationHelpers';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application } from '@/types/common.types';

export default function AdminApplicationsPage() {
  const { user, userRole } = useAuth();
  const { checkPlatformAccess } = usePlatformAccess();
  const [hasAccess, setHasAccess] = useState(false);
  
  // Role detection
  const isSuperAdmin = userRole === 'super_admin';
  const isOrgAdmin = userRole === 'admin';

  // Check platform access
  useEffect(() => {
    const checkAccess = async () => {
      const access = await checkPlatformAccess('applications');
      setHasAccess(access);
    };
    checkAccess();
  }, [checkPlatformAccess]);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Organization data for super admins
  const { organizations } = useOrganizationData(isSuperAdmin);

  // Dialog state management
  const {
    selectedApplication,
    smsDialogOpen,
    detailsDialogOpen,
    tenstreetModalOpen,
    handleSmsOpen,
    handleDetailsView,
    handleTenstreetUpdate,
    closeSmsDialog,
    closeDetailsDialog,
    closeTenstreetModal,
  } = useApplicationDialogs();

  // Screening dialog state
  const [screeningDialogOpen, setScreeningDialogOpen] = useState(false);
  const [screeningApplication, setScreeningApplication] = useState<Application | null>(null);

  const handleScreeningOpen = (application: Application) => {
    setScreeningApplication(application);
    setScreeningDialogOpen(true);
  };

  const closeScreeningDialog = () => {
    setScreeningDialogOpen(false);
    setScreeningApplication(null);
  };

  // Applications data with RLS-based filtering
  const {
    applications,
    loading,
    error,
    updateApplication,
    refresh,
  } = useApplications({
    enabled: hasAccess,
    filters: {
      search: searchTerm,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      organization_id: isOrgAdmin && organizationFilter === 'all' 
        ? undefined // RLS handles org scoping
        : organizationFilter !== 'all' 
          ? organizationFilter 
          : undefined,
    }
  });

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return filterApplications(
      applications,
      searchTerm,
      categoryFilter,
      sourceFilter,
      organizationFilter
    );
  }, [applications, searchTerm, categoryFilter, sourceFilter, organizationFilter]);

  // Statistics
  const statusCounts = useMemo(() => getStatusCounts(filteredApplications), [filteredApplications]);
  const categoryCounts = useMemo(() => getCategoryCounts(filteredApplications), [filteredApplications]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(new Set(filteredApplications.map(app => app.id)));
    } else {
      setSelectedApplications(new Set());
    }
  };

  const handleSelectApplication = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedApplications);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedApplications(newSelected);
  };

  // Bulk actions
  const handleBulkStatusChange = async (newStatus: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected') => {
    const promises = Array.from(selectedApplications).map(id =>
      updateApplication(id, { status: newStatus })
    );
    await Promise.all(promises);
    setSelectedApplications(new Set());
    refresh();
  };

  // Export functions
  const handleExportPDF = async () => {
    await generateApplicationsPDF(filteredApplications);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Source', 'Applied Date', 'Job Title'];
    const rows = filteredApplications.map(app => [
      `${app.first_name || ''} ${app.last_name || ''}`,
      app.applicant_email || '',
      app.phone || '',
      app.status || '',
      app.source || '',
      app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '',
      app.job_listings?.title || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!hasAccess) {
    return (
      <PageLayout title="Access Denied">
        <Card className="p-6">
          <p className="text-muted-foreground">
            You don't have permission to access the Applications module.
          </p>
        </Card>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout 
        title="Applications Management"
        description="Manage and track all job applications"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Applications Management"
      description={isOrgAdmin ? "Manage job applications for your organization" : "Track and manage all job applications"}
      actions={
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {selectedApplications.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  Bulk Actions ({selectedApplications.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkStatusChange('reviewed')}>
                  Mark as Reviewed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('interviewing')}>
                  Move to Interviewing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusChange('rejected')}>
                  Reject Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedApplications(new Set())}>
                  Clear Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      }
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Applications</p>
              <p className="text-2xl font-bold">{filteredApplications.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{statusCounts.pending || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{(statusCounts.reviewed || 0) + (statusCounts.interviewing || 0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hired</p>
              <p className="text-2xl font-bold">{statusCounts.hired || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="interviewing">Interviewing</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="A">Class A (CDL + Exp)</SelectItem>
              <SelectItem value="B">Class B (CDL, No Exp)</SelectItem>
              <SelectItem value="C">Class C (No CDL)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Meta">Meta</SelectItem>
              <SelectItem value="Indeed">Indeed</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="Direct">Direct Apply</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isSuperAdmin && (
          <div className="mt-4">
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {/* Applications List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All ({filteredApplications.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({statusCounts.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({statusCounts.reviewed || 0})
          </TabsTrigger>
          <TabsTrigger value="interviewing">
            Interviewing ({statusCounts.interviewing || 0})
          </TabsTrigger>
          <TabsTrigger value="hired">
            Hired ({statusCounts.hired || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({statusCounts.rejected || 0})
          </TabsTrigger>
        </TabsList>

        {(['all', 'pending', 'reviewed', 'interviewing', 'hired', 'rejected'] as const).map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredApplications.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  checked={selectedApplications.size === filteredApplications.filter(app => 
                    status === 'all' || app.status === status
                  ).length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">
                  Select all {status !== 'all' && `${status} applications`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApplications
                .filter(app => status === 'all' || app.status === status)
                .map((application) => (
                  <div key={application.id} className="relative">
                    <Checkbox
                      className="absolute top-2 left-2 z-10"
                      checked={selectedApplications.has(application.id)}
                      onCheckedChange={(checked) => 
                        handleSelectApplication(application.id, checked as boolean)
                      }
                    />
                    <ApplicationCard
                      application={application}
                      onStatusChange={(appId, newStatus) => 
                        updateApplication(appId, { status: newStatus as 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected' })
                      }
                      onRecruiterAssignment={() => {}}
                      onSmsOpen={() => handleSmsOpen(application)}
                      onDetailsView={() => handleDetailsView(application)}
                      onTenstreetUpdate={() => handleTenstreetUpdate(application)}
                      onScreeningOpen={() => handleScreeningOpen(application)}
                    />
                  </div>
                ))}
            </div>

            {filteredApplications.filter(app => status === 'all' || app.status === status).length === 0 && (
              <Card className="p-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No applications found</p>
                  <p className="text-sm">Try adjusting your filters or search criteria</p>
                </div>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      {selectedApplication && (
        <>
          <ApplicationDetailsDialog
            application={selectedApplication}
            isOpen={detailsDialogOpen}
            onClose={closeDetailsDialog}
          />
          
          <SmsConversationDialog
            application={selectedApplication}
            open={smsDialogOpen}
            onOpenChange={(open) => !open && closeSmsDialog()}
          />
          
          <TenstreetUpdateModal
            application={selectedApplication}
            isOpen={tenstreetModalOpen}
            onClose={closeTenstreetModal}
          />
        </>
      )}

      {/* Screening Requests Dialog */}
      {screeningApplication && (
        <ScreeningRequestsDialog
          application={screeningApplication}
          open={screeningDialogOpen}
          onOpenChange={(open) => !open && closeScreeningDialog()}
        />
      )}
    </PageLayout>
  );
}
