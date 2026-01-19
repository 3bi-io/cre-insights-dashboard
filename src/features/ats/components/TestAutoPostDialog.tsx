import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Send,
  AlertTriangle 
} from 'lucide-react';
import { useTestAutoPost } from '@/hooks/useATSConnections';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { ATSConnection } from '@/services/atsConnectionsService';

interface TestAutoPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection: ATSConnection;
}

interface Application {
  id: string;
  first_name: string | null;
  last_name: string | null;
  applicant_email: string | null;
  phone: string | null;
  status: string | null;
  applied_at: string | null;
  city: string | null;
  state: string | null;
}

export const TestAutoPostDialog: React.FC<TestAutoPostDialogProps> = ({
  open,
  onOpenChange,
  connection,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    external_id?: string;
    raw_response?: string;
  } | null>(null);

  const testAutoPost = useTestAutoPost();

  // Fetch recent applications for selection
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['applications-for-test', connection.organization_id, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('applications')
        .select(`
          id,
          first_name,
          last_name,
          applicant_email,
          phone,
          status,
          applied_at,
          city,
          state
        `)
        .order('applied_at', { ascending: false })
        .limit(20);

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,applicant_email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
    enabled: open,
  });

  const handleTest = async () => {
    if (!selectedApplication) return;

    setTestResult(null);
    const result = await testAutoPost.mutateAsync({
      connectionId: connection.id,
      applicationId: selectedApplication.id,
    });
    setTestResult(result);
  };

  const handleClose = () => {
    setSelectedApplication(null);
    setTestResult(null);
    setSearchTerm('');
    onOpenChange(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Auto-Post
          </DialogTitle>
          <DialogDescription>
            Select an application to send to <strong>{connection.name}</strong> ({connection.mode} mode)
          </DialogDescription>
        </DialogHeader>

        {/* Warning for production mode */}
        {connection.mode === 'production' && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <span className="text-yellow-600 dark:text-yellow-400">
              This connection is in production mode. The application will be sent to the live ATS.
            </span>
          </div>
        )}

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search-applications">Search Applications</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-applications"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Applications List */}
        <div className="flex-1 min-h-0">
          <p className="text-sm font-medium mb-2">Select Application</p>
          <ScrollArea className="h-[200px] border rounded-lg">
            {applicationsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : applications?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No applications found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {applications?.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedApplication(app)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedApplication?.id === app.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {app.first_name} {app.last_name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {app.status || 'pending'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {app.applicant_email || app.phone || 'No contact info'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {app.city && app.state ? `${app.city}, ${app.state}` : ''} 
                      {app.city && app.state ? ' • ' : ''}
                      Applied: {formatDate(app.applied_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult.success ? 'Success!' : 'Failed'}
              </span>
            </div>
            <p className="mt-1 text-sm">{testResult.message}</p>
            {testResult.external_id && (
              <p className="mt-1 text-xs text-muted-foreground">
                External ID: {testResult.external_id}
              </p>
            )}
            {testResult.raw_response && !testResult.success && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                  View raw response
                </summary>
                <pre className="mt-2 text-xs bg-background p-2 rounded overflow-x-auto max-h-[100px]">
                  {testResult.raw_response}
                </pre>
              </details>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleTest}
            disabled={!selectedApplication || testAutoPost.isPending}
          >
            {testAutoPost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Send to ATS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
