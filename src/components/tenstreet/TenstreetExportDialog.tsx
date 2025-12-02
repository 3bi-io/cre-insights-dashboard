import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenstreetExport } from '@/hooks/useTenstreetExport';

interface TenstreetExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  tenstreetCompanyId?: string;
}

const APPLICATION_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const EXPORT_FIELDS = [
  { id: 'first_name', label: 'First Name', category: 'Basic' },
  { id: 'last_name', label: 'Last Name', category: 'Basic' },
  { id: 'applicant_email', label: 'Email', category: 'Contact' },
  { id: 'phone', label: 'Phone', category: 'Contact' },
  { id: 'address_1', label: 'Address', category: 'Contact' },
  { id: 'city', label: 'City', category: 'Contact' },
  { id: 'state', label: 'State', category: 'Contact' },
  { id: 'zip', label: 'ZIP Code', category: 'Contact' },
  { id: 'status', label: 'Status', category: 'Application' },
  { id: 'applied_at', label: 'Application Date', category: 'Application' },
  { id: 'source', label: 'Source', category: 'Application' },
  { id: 'cdl_class', label: 'CDL Class', category: 'Qualifications' },
  { id: 'cdl_endorsements', label: 'CDL Endorsements', category: 'Qualifications' },
  { id: 'driving_experience_years', label: 'Experience Years', category: 'Qualifications' },
  { id: 'exp', label: 'Experience', category: 'Qualifications' },
];

export default function TenstreetExportDialog({
  open,
  onOpenChange,
  organizationId,
  tenstreetCompanyId,
}: TenstreetExportDialogProps) {
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'first_name',
    'last_name',
    'applicant_email',
    'phone',
    'status',
    'applied_at',
  ]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');

  const { exportOrganizationData, isExporting } = useTenstreetExport();

  // Fetch job listings for the organization
  const { data: jobListings } = useQuery({
    queryKey: ['job-listings-for-export', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_listings')
        .select('id, title')
        .eq('organization_id', organizationId)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId && open,
  });

  // Fetch preview count
  const { data: previewCount, isLoading: countLoading } = useQuery({
    queryKey: [
      'export-preview-count',
      organizationId,
      dateFrom?.toISOString(),
      dateTo?.toISOString(),
      selectedStatuses,
      selectedJobId,
    ],
    queryFn: async () => {
      let query = supabase
        .from('applications')
        .select('id, job_listings!inner(organization_id)', { count: 'exact', head: true })
        .eq('job_listings.organization_id', organizationId);

      if (dateFrom) {
        query = query.gte('applied_at', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('applied_at', dateTo.toISOString());
      }
      if (selectedStatuses.length > 0) {
        query = query.in('status', selectedStatuses);
      }
      if (selectedJobId && selectedJobId !== 'all') {
        query = query.eq('job_listing_id', selectedJobId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId && open,
  });

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
    );
  };

  const handleExport = async () => {
    await exportOrganizationData({
      organizationId: organizationId!,
      dateFrom: dateFrom?.toISOString(),
      dateTo: dateTo?.toISOString(),
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      jobListingIds: selectedJobId !== 'all' ? [selectedJobId] : undefined,
      fields: selectedFields,
      format: exportFormat,
    });
    onOpenChange(false);
  };

  const groupedFields = EXPORT_FIELDS.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, typeof EXPORT_FIELDS>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Tenstreet Data
          </DialogTitle>
          <DialogDescription>
            Export application data for your organization. Select filters and fields to customize
            your export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tenstreet Company ID Display */}
          {tenstreetCompanyId && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Tenstreet Company ID</span>
              <Badge variant="outline" className="font-mono">
                {tenstreetCompanyId}
              </Badge>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => date && setDateFrom(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => date && setDateTo(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Filter by Status (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {APPLICATION_STATUSES.map((status) => (
                <Badge
                  key={status.value}
                  variant={selectedStatuses.includes(status.value) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleStatus(status.value)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Job Filter */}
          <div className="space-y-2">
            <Label>Filter by Job Listing (optional)</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger>
                <SelectValue placeholder="All job listings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All job listings</SelectItem>
                {jobListings?.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <Label>Select Fields to Export</Label>
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">
                  {category}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                onClick={() => setExportFormat('csv')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={exportFormat === 'xlsx' ? 'default' : 'outline'}
                onClick={() => setExportFormat('xlsx')}
                className="flex-1"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          {/* Preview Count */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <span className="text-sm font-medium">Records matching filters</span>
            {countLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Badge variant="secondary" className="text-lg">
                {previewCount?.toLocaleString() || 0}
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={
              isExporting ||
              selectedFields.length === 0 ||
              !organizationId ||
              previewCount === 0
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {previewCount?.toLocaleString() || 0} Records
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
