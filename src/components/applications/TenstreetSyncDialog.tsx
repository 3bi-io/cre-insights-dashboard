import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, ExternalLink, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface TenstreetSyncDialogProps {
  application: any;
}

interface TenstreetConfig {
  clientId: string;
  password: string;
  service: string;
  mode: string;
  source: string;
  companyId: string;
  companyName: string;
}

const TenstreetSyncDialog: React.FC<TenstreetSyncDialogProps> = ({ application }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [syncData, setSyncData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock Tenstreet config - in a real app, this would come from settings
  const tenstreetConfig: TenstreetConfig = {
    clientId: '303',
    password: 'lS%!r3pjy@0SzMs!8Ln',
    service: 'applicant_search',
    mode: 'PROD',
    source: 'TheDriverBoardLead',
    companyId: '1300',
    companyName: 'C.R. England'
  };

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!application.phone) {
        throw new Error('Phone number is required for sync');
      }

      const { data, error } = await supabase.functions.invoke('tenstreet-integration', {
        body: {
          action: 'sync_applicant',
          phone: application.phone,
          config: tenstreetConfig
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSyncData(data);
      if (data.success && data.applicantData) {
        toast({
          title: "Sync Successful",
          description: data.isMockData ? 
            "Found mock applicant data (test mode)" : 
            "Found existing Tenstreet applicant data.",
        });
      } else {
        toast({
          title: "No Match Found",
          description: data.message || "No existing applicant found in Tenstreet for this phone number.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: `Failed to sync with Tenstreet: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (tenstreetData: any) => {
      const updates = {
        first_name: tenstreetData.firstName || application.first_name,
        last_name: tenstreetData.lastName || application.last_name,
        applicant_email: tenstreetData.email || application.applicant_email,
        phone: tenstreetData.phone || application.phone,
        notes: application.notes ? 
          `${application.notes}\n\nTenstreet Sync (${new Date().toISOString()}): Driver ID: ${tenstreetData.driverId}, Experience: ${tenstreetData.experience} months, CDL Class: ${tenstreetData.cdlClass}` :
          `Tenstreet Sync (${new Date().toISOString()}): Driver ID: ${tenstreetData.driverId}, Experience: ${tenstreetData.experience} months, CDL Class: ${tenstreetData.cdlClass}`,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', application.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Application Updated",
        description: "Application has been updated with Tenstreet data.",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update application: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    setIsLoading(true);
    syncMutation.mutate();
    setIsLoading(false);
  };

  const handleMergeData = () => {
    if (syncData?.applicantData) {
      updateApplicationMutation.mutate(syncData.applicantData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Sync Tenstreet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Sync with Tenstreet
          </DialogTitle>
          <DialogDescription>
            Search for existing applicant data in Tenstreet using phone number: {application.phone || 'No phone number available'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!application.phone ? (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Phone number is required for Tenstreet sync</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button 
                onClick={handleSync} 
                disabled={syncMutation.isPending}
                className="w-full"
              >
                {syncMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Searching Tenstreet...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Search Tenstreet Database
                  </>
                )}
              </Button>

              {syncData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       {syncData.success && syncData.applicantData ? (
                         <>
                           <CheckCircle className="w-5 h-5 text-green-600" />
                           Existing Applicant Found
                           {syncData.isMockData && (
                             <Badge variant="outline" className="ml-2 text-xs">
                               Test Mode
                             </Badge>
                           )}
                         </>
                       ) : (
                         <>
                           <AlertCircle className="w-5 h-5 text-amber-600" />
                           No Matching Applicant
                         </>
                       )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {syncData.applicantData ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Current Application</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Name:</span> {application.first_name} {application.last_name}</p>
                              <p><span className="font-medium">Email:</span> {application.applicant_email}</p>
                              <p><span className="font-medium">Phone:</span> {application.phone}</p>
                              <p><span className="font-medium">Status:</span> {application.status}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Tenstreet Data</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Name:</span> {syncData.applicantData.firstName} {syncData.applicantData.lastName}</p>
                              <p><span className="font-medium">Email:</span> {syncData.applicantData.email}</p>
                              <p><span className="font-medium">Phone:</span> {syncData.applicantData.phone}</p>
                              <p><span className="font-medium">Driver ID:</span> {syncData.applicantData.driverId}</p>
                              <p><span className="font-medium">Experience:</span> {syncData.applicantData.experience} months</p>
                              <p><span className="font-medium">CDL Class:</span> {syncData.applicantData.cdlClass}</p>
                              <p><span className="font-medium">Status:</span> {syncData.applicantData.status}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Merge Tenstreet data into this application?
                          </p>
                          <Button 
                            onClick={handleMergeData}
                            disabled={updateApplicationMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            {updateApplicationMutation.isPending ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Merge Data
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {syncData.message}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TenstreetSyncDialog;