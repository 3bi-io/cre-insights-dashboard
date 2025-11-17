import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Edit, TestTube, Eye, CheckCircle, XCircle, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClientWebhook {
  id: string;
  client_id?: string;
  source_filter: string[];
  webhook_url: string;
  enabled: boolean;
  event_types: string[];
  secret_key?: string;
  last_triggered_at?: string;
  last_success_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

interface WebhookFormData {
  source_filter: string[];
  webhook_url: string;
  enabled: boolean;
  event_types: string[];
  secret_key?: string;
}

const initialFormData: WebhookFormData = {
  source_filter: [],
  webhook_url: '',
  enabled: true,
  event_types: ['created', 'updated'],
  secret_key: '',
};

const sourceOptions = [
  { value: 'Direct Application', label: 'Direct Applications (/apply)' },
  { value: 'ElevenLabs', label: 'ElevenLabs (Voice Agent)' },
  { value: 'Facebook Lead Gen', label: 'Facebook Lead Gen' },
];

const eventTypeOptions = [
  { value: 'created', label: 'Application Created' },
  { value: 'updated', label: 'Application Updated' },
  { value: 'deleted', label: 'Application Deleted' },
];

export default function ClientWebhookManager() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<ClientWebhook | null>(null);
  const [formData, setFormData] = useState<WebhookFormData>(initialFormData);
  const [bulkExportWebhookId, setBulkExportWebhookId] = useState<string | null>(null);
  const [bulkExportCount, setBulkExportCount] = useState<number>(0);
  const [bulkExportLoading, setBulkExportLoading] = useState(false);


  // Fetch webhooks
  const { data: webhooks = [], isLoading: webhooksLoading } = useQuery({
    queryKey: ['client-webhooks', organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_webhooks')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClientWebhook[];
    },
    enabled: !!organization?.id,
  });

  // Get source labels helper
  const getSourceLabels = (sources: string[]) => {
    if (!sources || sources.length === 0) return 'No sources selected';
    return sources.map(source => {
      const option = sourceOptions.find(opt => opt.value === source);
      return option ? option.label : source;
    }).join(', ');
  };

  // Create/Update webhook mutation
  const saveWebhookMutation = useMutation({
    mutationFn: async (data: WebhookFormData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (editingWebhook) {
        const { error } = await supabase
          .from('client_webhooks')
          .update({
            source_filter: data.source_filter,
            webhook_url: data.webhook_url,
            enabled: data.enabled,
            event_types: data.event_types,
            secret_key: data.secret_key || null,
          })
          .eq('id', editingWebhook.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_webhooks')
          .insert({
            source_filter: data.source_filter,
            organization_id: organization?.id,
            user_id: user.id,
            webhook_url: data.webhook_url,
            enabled: data.enabled,
            event_types: data.event_types,
            secret_key: data.secret_key || null,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success(editingWebhook ? 'Webhook updated' : 'Webhook created');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save webhook');
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from('client_webhooks')
        .delete()
        .eq('id', webhookId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success('Webhook deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete webhook');
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (webhook: ClientWebhook) => {
      // Find a sample application for this client
      const { data: application } = await supabase
        .from('applications')
        .select('id, job_listing:job_listings!inner(client_id)')
        .eq('job_listing.client_id', webhook.client_id)
        .limit(1)
        .single();

      if (!application) {
        throw new Error('No applications found for this client to test with');
      }

      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: {
          application_id: application.id,
          event_type: 'created',
          test_mode: true,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test webhook sent successfully');
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send test webhook');
    },
  });

  // Bulk export mutation
  const bulkExportMutation = useMutation({
    mutationFn: async (webhookId: string) => {
      const { data, error } = await supabase.functions.invoke('client-webhook-bulk-export', {
        body: { webhook_id: webhookId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Bulk export successful: ${data.applications_sent} applications sent`);
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      setBulkExportWebhookId(null);
    },
    onError: (error: Error) => {
      toast.error(`Bulk export failed: ${error.message}`);
      setBulkExportWebhookId(null);
    },
  });

  // Handle bulk export click - count applications first
  const handleBulkExportClick = async (webhook: ClientWebhook) => {
    setBulkExportLoading(true);
    
    try {
      // Query count of applications matching source_filter
      let query = supabase
        .from('applications')
        .select('id, job_listings!inner(organization_id)', { count: 'exact', head: true })
        .eq('job_listings.organization_id', organization?.id);
      
      if (webhook.source_filter && webhook.source_filter.length > 0) {
        query = query.in('source', webhook.source_filter);
      }
      
      const { count, error } = await query;
      
      if (error) {
        toast.error('Failed to count applications');
        setBulkExportLoading(false);
        return;
      }
      
      setBulkExportCount(count || 0);
      setBulkExportWebhookId(webhook.id);
    } catch (error) {
      toast.error('Failed to count applications');
    } finally {
      setBulkExportLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingWebhook(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (webhook: ClientWebhook) => {
    setEditingWebhook(webhook);
    setFormData({
      source_filter: webhook.source_filter || [],
      webhook_url: webhook.webhook_url,
      enabled: webhook.enabled,
      event_types: webhook.event_types,
      secret_key: webhook.secret_key || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (formData.source_filter.length === 0 || !formData.webhook_url) {
      toast.error('Please select at least one source and provide a webhook URL');
      return;
    }

    if (formData.event_types.length === 0) {
      toast.error('Please select at least one event type');
      return;
    }

    saveWebhookMutation.mutate(formData);
  };

  const toggleSource = (source: string) => {
    setFormData(prev => {
      const currentSources = prev.source_filter || [];
      const isSelected = currentSources.includes(source);
      
      return {
        ...prev,
        source_filter: isSelected
          ? currentSources.filter(s => s !== source)
          : [...currentSources, source]
      };
    });
  };

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType],
    }));
  };

  const getStatusBadge = (webhook: ClientWebhook) => {
    if (!webhook.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (webhook.last_error) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    }
    
    if (webhook.last_success_at) {
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Active</Badge>;
    }
    
    return <Badge variant="outline">Not Tested</Badge>;
  };

  const formatDate = (date?: string) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  if (webhooksLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Webhook Configurations</h2>
          <p className="text-muted-foreground">
            Send application data to third-party systems when applications are received
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWebhook ? 'Edit' : 'Add'} Client Webhook</DialogTitle>
              <DialogDescription>
                Configure a webhook to send application data to a third-party system
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook Sources *</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Select which application sources should trigger this webhook
                </p>
                <div className="space-y-2 border rounded-md p-3">
                  {sourceOptions.map(source => (
                    <div key={source.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`source-${source.value}`}
                        checked={formData.source_filter.includes(source.value)}
                        onCheckedChange={() => toggleSource(source.value)}
                      />
                      <Label 
                        htmlFor={`source-${source.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {source.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL *</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  placeholder="https://hooks.zapier.com/..."
                  value={formData.webhook_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Event Types *</Label>
                <div className="space-y-2">
                  {eventTypeOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={formData.event_types.includes(option.value)}
                        onCheckedChange={() => toggleEventType(option.value)}
                      />
                      <label htmlFor={option.value} className="text-sm cursor-pointer">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret_key">Secret Key (Optional)</Label>
                <Input
                  id="secret_key"
                  type="password"
                  placeholder="For HMAC signature verification"
                  value={formData.secret_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret_key: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  If provided, an X-Webhook-Signature header will be included for verification
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Enable webhook</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saveWebhookMutation.isPending}>
                {saveWebhookMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingWebhook ? 'Update' : 'Create'} Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first client webhook
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{getSourceLabels(webhook.source_filter)}</h3>
                    {getStatusBadge(webhook)}
                  </div>
                  <p className="text-sm text-muted-foreground break-all">{webhook.webhook_url}</p>
                </div>
              </div>

              <div className="text-sm space-y-1 mb-3">
                <p>
                  <span className="text-muted-foreground">Events:</span>{' '}
                  {webhook.event_types.join(', ')}
                </p>
                <p>
                  <span className="text-muted-foreground">Last triggered:</span>{' '}
                  {formatDate(webhook.last_triggered_at)}
                </p>
                {webhook.last_success_at && (
                  <p>
                    <span className="text-muted-foreground">Last success:</span>{' '}
                    {formatDate(webhook.last_success_at)}
                  </p>
                )}
                {webhook.last_error && (
                  <p className="text-destructive">
                    <span className="text-muted-foreground">Last error:</span>{' '}
                    {webhook.last_error}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkExportClick(webhook)}
                  disabled={!webhook.enabled || bulkExportLoading || bulkExportMutation.isPending}
                >
                  {(bulkExportLoading && bulkExportWebhookId === webhook.id) || (bulkExportMutation.isPending && bulkExportWebhookId === webhook.id) ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Bulk Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testWebhookMutation.mutate(webhook)}
                  disabled={testWebhookMutation.isPending}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(webhook)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this webhook?')) {
                      deleteWebhookMutation.mutate(webhook.id);
                    }
                  }}
                  disabled={deleteWebhookMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Export Confirmation Dialog */}
      <AlertDialog open={!!bulkExportWebhookId && !bulkExportLoading} onOpenChange={() => setBulkExportWebhookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Export</AlertDialogTitle>
            <AlertDialogDescription>
              This will send <strong>{bulkExportCount} application(s)</strong> to the configured webhook URL.
              {bulkExportCount === 0 && (
                <span className="block mt-2 text-yellow-600">
                  No applications match the webhook's source filter.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bulkExportWebhookId) {
                  bulkExportMutation.mutate(bulkExportWebhookId);
                }
              }}
              disabled={bulkExportCount === 0}
            >
              Export {bulkExportCount} Application{bulkExportCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
