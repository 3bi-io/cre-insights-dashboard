import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TenstreetService } from '@/features/platforms/services';
import { 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  DollarSign,
  Download,
  AlertCircle,
  Loader2,
  Plus,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

interface XchangeRequest {
  id: string;
  application_id: string;
  driver_id: string;
  request_type: string;
  provider: string | null;
  status: string;
  request_date: string;
  completion_date: string | null;
  result_data: any;
  cost_cents: number;
  reference_number: string | null;
  notes: string | null;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

interface XchangeManagerProps {
  applicationId?: string;
  driverId?: string;
  companyId: string;
}

export default function XchangeManager({ applicationId, driverId, companyId }: XchangeManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [requestNotes, setRequestNotes] = useState('');

  // Fetch xchange requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['xchange-requests', applicationId, driverId],
    queryFn: async () => {
      let query = supabase
        .from('tenstreet_xchange_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }
      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as XchangeRequest[];
    },
    enabled: !!(applicationId || driverId)
  });

  // Calculate statistics
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter(r => r.status === 'pending' || r.status === 'in_progress').length || 0,
    completed: requests?.filter(r => r.status === 'completed').length || 0,
    failed: requests?.filter(r => r.status === 'failed').length || 0,
    totalCost: requests?.reduce((sum, r) => sum + (r.cost_cents || 0), 0) || 0
  };

  // Request verification mutation
  const requestVerificationMutation = useMutation({
    mutationFn: async (params: { type: string; provider: string; notes: string }) => {
      if (!driverId || !applicationId) {
        throw new Error('Driver ID and Application ID are required');
      }

      // Call appropriate TenstreetService method based on type
      let result;
      switch (params.type) {
        case 'MVR':
          result = await TenstreetService.requestMVR(driverId, {
            companyId,
            provider: params.provider
          });
          break;
        case 'DrugTest':
          result = await TenstreetService.requestDrugTest(driverId, {
            companyId,
            testType: 'pre-employment',
            provider: params.provider,
            schedulingNotes: params.notes
          });
          break;
        case 'EmploymentVerification':
          result = await TenstreetService.requestEmploymentVerification(driverId, companyId);
          break;
        case 'CriminalBackground':
          result = await TenstreetService.requestCriminalBackground(driverId, companyId);
          break;
        default:
          throw new Error('Invalid request type');
      }

      // Store request in database
      const { data: orgData } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { data, error } = await supabase
        .from('tenstreet_xchange_requests')
        .insert({
          application_id: applicationId,
          driver_id: driverId,
          request_type: params.type,
          provider: params.provider,
          status: 'pending',
          notes: params.notes,
          organization_id: orgData?.organization_id,
          cost_cents: 0 // Will be updated when completed
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Verification Requested',
        description: 'The verification request has been submitted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['xchange-requests'] });
      setIsRequestDialogOpen(false);
      setSelectedRequestType('');
      setSelectedProvider('');
      setRequestNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      in_progress: { variant: 'default', icon: Loader2, label: 'In Progress' },
      completed: { variant: 'default', icon: CheckCircle2, label: 'Completed' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Failed' },
      cancelled: { variant: 'outline', icon: AlertCircle, label: 'Cancelled' }
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getRequestTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      MVR: Shield,
      DrugTest: FileCheck,
      EmploymentVerification: FileCheck,
      CriminalBackground: Shield
    };
    return icons[type] || FileCheck;
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCost)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Background Checks & Verifications</CardTitle>
              <CardDescription>
                Request and track MVR checks, drug tests, employment verifications, and background checks
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsRequestDialogOpen(true)}
              disabled={!driverId || !applicationId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Verification
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => {
                const Icon = getRequestTypeIcon(request.request_type);
                return (
                  <div
                    key={request.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{request.request_type}</h4>
                          {getStatusBadge(request.status)}
                        </div>
                        {request.provider && (
                          <p className="text-sm text-muted-foreground">
                            Provider: {request.provider}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Requested: {format(new Date(request.request_date), 'MMM dd, yyyy')}</span>
                          {request.completion_date && (
                            <span>Completed: {format(new Date(request.completion_date), 'MMM dd, yyyy')}</span>
                          )}
                          {request.reference_number && (
                            <span>Ref: {request.reference_number}</span>
                          )}
                        </div>
                        {request.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{request.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.cost_cents > 0 && (
                        <span className="text-sm font-medium">{formatCurrency(request.cost_cents)}</span>
                      )}
                      {request.status === 'completed' && request.result_data && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No verification requests yet</p>
              <p className="text-sm mt-2">Click "Request Verification" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Verification Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Verification</DialogTitle>
            <DialogDescription>
              Submit a background check or verification request for this applicant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request-type">Verification Type</Label>
              <Select value={selectedRequestType} onValueChange={setSelectedRequestType}>
                <SelectTrigger id="request-type">
                  <SelectValue placeholder="Select verification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MVR">Motor Vehicle Record (MVR)</SelectItem>
                  <SelectItem value="DrugTest">Drug Test Screening</SelectItem>
                  <SelectItem value="EmploymentVerification">Employment Verification</SelectItem>
                  <SelectItem value="CriminalBackground">Criminal Background Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRequestType && (
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRequestType === 'MVR' && (
                      <>
                        <SelectItem value="FirstAdvantage">FirstAdvantage</SelectItem>
                        <SelectItem value="Tenstreet">Tenstreet MVR</SelectItem>
                      </>
                    )}
                    {selectedRequestType === 'DrugTest' && (
                      <>
                        <SelectItem value="LabCorp">LabCorp</SelectItem>
                        <SelectItem value="Quest">Quest Diagnostics</SelectItem>
                      </>
                    )}
                    {selectedRequestType === 'EmploymentVerification' && (
                      <SelectItem value="TheWorkNumber">The Work Number</SelectItem>
                    )}
                    {selectedRequestType === 'CriminalBackground' && (
                      <>
                        <SelectItem value="FirstAdvantage">FirstAdvantage</SelectItem>
                        <SelectItem value="Checkr">Checkr</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions or notes..."
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRequestDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => requestVerificationMutation.mutate({
                type: selectedRequestType,
                provider: selectedProvider,
                notes: requestNotes
              })}
              disabled={!selectedRequestType || !selectedProvider || requestVerificationMutation.isPending}
            >
              {requestVerificationMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
