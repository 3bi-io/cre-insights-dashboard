import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { FileCheck, Shield, Clipboard, Upload, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ScreeningRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
}

const ScreeningRequestsDialog: React.FC<ScreeningRequestsDialogProps> = ({
  open,
  onOpenChange,
  application,
}) => {
  const [requestType, setRequestType] = useState<'background_check' | 'employment_application' | 'drug_screening'>('background_check');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [providerName, setProviderName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing screening requests
  const { data: screeningRequests, isLoading } = useQuery({
    queryKey: ['screening-requests', application?.id],
    queryFn: async () => {
      if (!application?.id) return [];
      
      const { data, error } = await supabase
        .from('screening_requests')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!application?.id && open,
  });

  // Fetch documents
  const { data: documents } = useQuery({
    queryKey: ['application-documents', application?.id],
    queryFn: async () => {
      if (!application?.id) return [];
      
      const { data, error } = await supabase
        .from('application_documents')
        .select('*')
        .eq('application_id', application.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!application?.id && open,
  });

  // Send screening request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-screening-request', {
        body: {
          applicationId: application.id,
          requestType,
          recipientEmail: recipientEmail || application.applicant_email,
          providerName: providerName || undefined,
          additionalData: { notes }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screening-requests'] });
      toast({
        title: 'Request Sent',
        description: 'Screening request has been sent successfully.',
      });
      setRecipientEmail('');
      setProviderName('');
      setNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send screening request.',
        variant: 'destructive',
      });
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, documentType, screeningRequestId }: { file: File; documentType: string; screeningRequestId?: string }) => {
      // Upload to storage
      const filePath = `${application.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('application_documents')
        .insert({
          application_id: application.id,
          screening_request_id: screeningRequestId,
          document_type: documentType,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-documents'] });
      toast({
        title: 'Document Uploaded',
        description: 'Document has been uploaded successfully.',
      });
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document.',
        variant: 'destructive',
      });
    },
  });

  const handleSendRequest = () => {
    sendRequestMutation.mutate();
  };

  const handleFileUpload = async (documentType: string, screeningRequestId?: string) => {
    if (!selectedFile) return;
    uploadDocumentMutation.mutate({ file: selectedFile, documentType, screeningRequestId });
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'background_check': return <Shield className="w-5 h-5" />;
      case 'employment_application': return <Clipboard className="w-5 h-5" />;
      case 'drug_screening': return <FileCheck className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'sent': return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'expired': return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" aria-describedby="screening-requests-description">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Screening & Documents</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage background checks, applications, and drug screenings
              </p>
            </div>
          </div>
          <div id="screening-requests-description" className="sr-only">
            Send screening requests and manage documents for background checks, employment applications, and drug screenings.
          </div>
        </DialogHeader>

        <Tabs defaultValue="requests" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Send Requests</TabsTrigger>
            <TabsTrigger value="history">Request History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="flex-1 overflow-auto mt-4 space-y-6">
            <Card className="border-border/40">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="screening-request-type">Request Type</Label>
                  <Select 
                    name="requestType"
                    value={requestType} 
                    onValueChange={(value: any) => setRequestType(value)}
                  >
                    <SelectTrigger id="screening-request-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="background_check">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Background Check
                        </div>
                      </SelectItem>
                      <SelectItem value="employment_application">
                        <div className="flex items-center gap-2">
                          <Clipboard className="w-4 h-4" />
                          Employment Application
                        </div>
                      </SelectItem>
                      <SelectItem value="drug_screening">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4" />
                          Drug Screening
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="screening-recipient-email">Recipient Email</Label>
                    <Input
                      id="screening-recipient-email"
                      name="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder={application?.applicant_email || 'email@example.com'}
                    />
                    <p className="text-xs text-muted-foreground">Leave empty to use applicant's email</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="screening-provider-name">Provider Name (Optional)</Label>
                    <Input
                      id="screening-provider-name"
                      name="providerName"
                      value={providerName}
                      onChange={(e) => setProviderName(e.target.value)}
                      placeholder="e.g., Acme Screening Services"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="screening-notes">Notes (Optional)</Label>
                  <Textarea
                    id="screening-notes"
                    name="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes or instructions..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleSendRequest}
                  disabled={sendRequestMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {sendRequestMutation.isPending ? 'Sending...' : 'Send Request'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : screeningRequests?.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                      <FileCheck className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No screening requests yet</p>
                  </div>
                ) : (
                  screeningRequests?.map((request) => (
                    <Card key={request.id} className="border-border/40 hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {getRequestIcon(request.request_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium capitalize">
                                {request.request_type.replace(/_/g, ' ')}
                              </h4>
                              <Badge variant="outline" className={getStatusColor(request.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(request.status)}
                                  {request.status}
                                </span>
                              </Badge>
                            </div>
                            {request.provider_name && (
                              <p className="text-sm text-muted-foreground">Provider: {request.provider_name}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Sent: {new Date(request.sent_at).toLocaleDateString()}</span>
                              {request.expires_at && (
                                <span>Expires: {new Date(request.expires_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 overflow-auto mt-4 space-y-4">
            <Card className="border-border/40">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                {selectedFile && (
                  <Button
                    onClick={() => handleFileUpload('general')}
                    disabled={uploadDocumentMutation.isPending}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadDocumentMutation.isPending ? 'Uploading...' : 'Upload Document'}
                  </Button>
                )}
              </CardContent>
            </Card>

            <ScrollArea className="flex-1">
              <div className="space-y-3">
                {documents?.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                  </div>
                ) : (
                  documents?.map((doc) => (
                    <Card key={doc.id} className="border-border/40">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{doc.document_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const { data } = await supabase.storage
                                .from('application-documents')
                                .createSignedUrl(doc.file_path, 3600);
                              if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ScreeningRequestsDialog;
