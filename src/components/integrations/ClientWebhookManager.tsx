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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const webhookData = {
        ...data,
        user_id: user.id,
        organization_id: organization?.id,
      };

      if (editingWebhook) {
        const { error } = await supabase
          .from('client_webhooks')
          .update(webhookData)
          .eq('id', editingWebhook.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('client_webhooks')
          .insert(webhookData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success(editingWebhook ? 'Webhook updated' : 'Webhook created');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save webhook');
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_webhooks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
      toast.success('Webhook deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete webhook');
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (webhook: ClientWebhook) => {
      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: {
          test: true,
          webhook_url: webhook.webhook_url,
          secret_key: webhook.secret_key,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test webhook sent successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send test webhook');
    },
  });

  // Handle bulk export
  const handleBulkExport = async (webhookId: string) => {
    setBulkExportLoading(true);
    setBulkExportWebhookId(webhookId);

    try {
      const webhook = webhooks.find(w => w.id === webhookId);
      if (!webhook) throw new Error('Webhook not found');

      // Get application count matching source filter
      let query = supabase
        .from('applications')
        .select('id', { count: 'exact', head: true });

      if (webhook.source_filter && webhook.source_filter.length > 0) {
        if (webhook.source_filter.includes('Direct Application')) {
          query = query.eq('source', 'Direct Application');
        }
      }

      const { count, error: countError } = await query;
      if (countError) throw countError;

      setBulkExportCount(count || 0);
    } catch (error: any) {
      toast.error(error.message || 'Failed to count applications');
      setBulkExportWebhookId(null);
    } finally {
      setBulkExportLoading(false);
    }
  };

  // Confirm bulk export
  const confirmBulkExport = async () => {
    if (!bulkExportWebhookId) return;

    try {
      const webhook = webhooks.find(w => w.id === bulkExportWebhookId);
      if (!webhook) throw new Error('Webhook not found');

      const { data, error } = await supabase.functions.invoke('client-webhook-bulk-export', {
        body: {
          webhook_id: bulkExportWebhookId,
          source_filter: webhook.source_filter,
        },
      });

      if (error) throw error;

      toast.success(`Successfully exported ${data?.applications_sent || 0} applications`);
      queryClient.invalidateQueries({ queryKey: ['client-webhooks'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to export applications');
    } finally {
      setBulkExportWebhookId(null);
      setBulkExportCount(0);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingWebhook(null);
    setIsDialogOpen(false);
  };

  // Handle edit
  const handleEdit = (webhook: ClientWebhook) => {
    setEditingWebhook(webhook);
    setFormData({
      source_filter: webhook.source_filter || [],
      webhook_url: webhook.webhook_url,
      enabled: webhook.enabled,
      event_types: webhook.event_types || ['created', 'updated'],
      secret_key: webhook.secret_key || '',
    });
    setIsDialogOpen(true);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.webhook_url) {
      toast.error('Webhook URL is required');
      return;
    }

    if (formData.source_filter.length === 0) {
      toast.error('Please select at least one source');
      return;
    }

    saveWebhookMutation.mutate(formData);
  };

  // Toggle source filter
  const toggleSourceFilter = (value: string) => {
    setFormData(prev => ({
      ...prev,
      source_filter: prev.source_filter.includes(value)
        ? prev.source_filter.filter(v => v !== value)
        : [...prev.source_filter, value],
    }));
  };

  // Toggle event type
  const toggleEventType = (value: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(value)
        ? prev.event_types.filter(v => v !== value)
        : [...prev.event_types, value],
    }));
  };

  if (webhooksLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Client Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Configure webhooks to receive application data in real-time
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingWebhook ? 'Edit Webhook' : 'Create Webhook'}
              </DialogTitle>
              <DialogDescription>
                Configure a webhook to receive application data based on source filters
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Application Sources *</Label>
                <div className="space-y-2">
                  {sourceOptions.map((source) => (
                    <div key={source.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={source.value}
                        checked={formData.source_filter.includes(source.value)}
                        onCheckedChange={() => toggleSourceFilter(source.value)}
                      />
                      <label
                        htmlFor={source.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {source.label}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which application sources should trigger this webhook
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook_url">Webhook URL *</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret_key">Secret Key (Optional)</Label>
                <Input
                  id="secret_key"
                  type="password"
                  placeholder="Your webhook secret"
                  value={formData.secret_key}
                  onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Used for X-Webhook-Signature header verification
                </p>
              </div>

              <div className="space-y-2">
                <Label>Event Types</Label>
                <div className="space-y-2">
                  {eventTypeOptions.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={formData.event_types.includes(event.value)}
                        onCheckedChange={() => toggleEventType(event.value)}
                      />
                      <label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveWebhookMutation.isPending}>
                  {saveWebhookMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingWebhook ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No webhooks configured</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {webhook.webhook_url}
                    </code>
                    {webhook.enabled ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sources: {getSourceLabels(webhook.source_filter)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Events: {webhook.event_types.join(', ')}
                  </p>
                  {webhook.last_error && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <span>Last error: {webhook.last_error}</span>
                    </div>
                  )}
                  {webhook.last_success_at && (
                    <p className="text-xs text-muted-foreground">
                      Last success: {new Date(webhook.last_success_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhookMutation.mutate(webhook)}
                    disabled={testWebhookMutation.isPending}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkExport(webhook.id)}
                    disabled={bulkExportLoading}
                  >
                    {bulkExportLoading && bulkExportWebhookId === webhook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(webhook)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                    disabled={deleteWebhookMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!bulkExportWebhookId} onOpenChange={(open) => !open && setBulkExportWebhookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Export</AlertDialogTitle>
            <AlertDialogDescription>
              This will send {bulkExportCount} application(s) to the webhook URL. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkExport}>
              Export {bulkExportCount} Applications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
