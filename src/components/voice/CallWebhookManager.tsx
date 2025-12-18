import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Phone,
  Plus,
  Pencil,
  Trash2,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useCallWebhooks, CallWebhook } from '@/hooks/useCallWebhooks';
import { format } from 'date-fns';

const EVENT_TYPES = [
  { value: 'completed', label: 'Completed', description: 'Call was successfully completed' },
  { value: 'failed', label: 'Failed', description: 'Call failed to connect' },
  { value: 'no_answer', label: 'No Answer', description: 'Recipient did not answer' },
  { value: 'busy', label: 'Busy', description: 'Line was busy' },
  { value: 'cancelled', label: 'Cancelled', description: 'Call was cancelled' },
];

interface WebhookFormData {
  webhook_url: string;
  enabled: boolean;
  event_types: string[];
  secret_key: string;
}

const initialFormData: WebhookFormData = {
  webhook_url: '',
  enabled: true,
  event_types: ['completed', 'failed', 'no_answer'],
  secret_key: '',
};

export const CallWebhookManager: React.FC = () => {
  const {
    webhooks,
    isLoading,
    createWebhook,
    isCreating,
    updateWebhook,
    isUpdating,
    deleteWebhook,
    isDeleting,
    testWebhook,
    isTesting,
  } = useCallWebhooks();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<CallWebhook | null>(null);
  const [formData, setFormData] = useState<WebhookFormData>(initialFormData);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);

  const handleOpenDialog = (webhook?: CallWebhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData({
        webhook_url: webhook.webhook_url,
        enabled: webhook.enabled,
        event_types: webhook.event_types,
        secret_key: webhook.secret_key || '',
      });
    } else {
      setEditingWebhook(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingWebhook(null);
    setFormData(initialFormData);
  };

  const handleSubmit = () => {
    if (editingWebhook) {
      updateWebhook({
        id: editingWebhook.id,
        webhook_url: formData.webhook_url,
        enabled: formData.enabled,
        event_types: formData.event_types,
        secret_key: formData.secret_key || null,
      });
    } else {
      createWebhook({
        webhook_url: formData.webhook_url,
        enabled: formData.enabled,
        event_types: formData.event_types,
        secret_key: formData.secret_key || undefined,
      });
    }
    handleCloseDialog();
  };

  const handleEventTypeToggle = (eventType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      event_types: checked
        ? [...prev.event_types, eventType]
        : prev.event_types.filter(t => t !== eventType),
    }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Webhooks
            </CardTitle>
            <CardDescription>
              Send notifications when outbound calls complete
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingWebhook ? 'Edit Webhook' : 'Add Call Webhook'}
                </DialogTitle>
                <DialogDescription>
                  Configure a webhook endpoint to receive call completion notifications
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook_url">Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    placeholder="https://your-endpoint.com/webhook"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                  />
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
                    Used to sign webhook payloads for verification
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Event Types</Label>
                  {EVENT_TYPES.map((event) => (
                    <div key={event.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={event.value}
                        checked={formData.event_types.includes(event.value)}
                        onCheckedChange={(checked) => 
                          handleEventTypeToggle(event.value, checked as boolean)
                        }
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor={event.value}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {event.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enabled</Label>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.webhook_url || formData.event_types.length === 0 || isCreating || isUpdating}
                >
                  {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingWebhook ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : webhooks && webhooks.length > 0 ? (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                        {webhook.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      {webhook.last_error && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-mono text-muted-foreground truncate max-w-md">
                      {webhook.webhook_url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(webhook)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this webhook? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteWebhook(webhook.id)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {webhook.event_types.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last triggered: {formatDate(webhook.last_triggered_at)}
                  </div>
                  {webhook.last_success_at && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Last success: {formatDate(webhook.last_success_at)}
                    </div>
                  )}
                </div>

                {webhook.last_error && (
                  <div className="p-2 bg-destructive/10 rounded text-xs text-destructive">
                    {webhook.last_error}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No Call Webhooks</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a webhook to receive notifications when outbound calls complete
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Webhook
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CallWebhookManager;
