import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganizationWebhook } from '@/hooks/useOrganizationWebhook';
import { Loader2, Send, Trash2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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

export const OrganizationWebhookConfig = () => {
  const {
    webhook,
    isLoading,
    saveWebhook,
    isSaving,
    deleteWebhook,
    isDeleting,
    testWebhook,
    isTesting,
  } = useOrganizationWebhook();

  const [formData, setFormData] = useState({
    webhook_url: '',
    enabled: true,
    secret_key: '',
  });

  useEffect(() => {
    if (webhook) {
      setFormData({
        webhook_url: webhook.webhook_url,
        enabled: webhook.enabled,
        secret_key: webhook.secret_key || '',
      });
    }
  }, [webhook]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWebhook(formData);
  };

  const handleTest = () => {
    testWebhook();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization n8n Webhook</CardTitle>
        <CardDescription>
          Configure your organization's n8n webhook to receive batch application exports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Setup Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Setup Instructions:</strong>
            <ol className="mt-2 ml-4 space-y-1 list-decimal">
              <li>Create a webhook trigger node in your n8n workflow</li>
              <li>Copy the webhook URL from n8n</li>
              <li>Paste it below and save</li>
              <li>Test the connection using the "Test Webhook" button</li>
              <li>Use the "Export to n8n" button on the Applications page to send data</li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Webhook Status */}
        {webhook && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status:</span>
              {webhook.enabled ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Enabled
                </span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-600">
                  <XCircle className="h-4 w-4" />
                  Disabled
                </span>
              )}
            </div>
            {webhook.last_triggered_at && (
              <div className="text-sm text-muted-foreground">
                Last triggered: {new Date(webhook.last_triggered_at).toLocaleString()}
              </div>
            )}
            {webhook.last_success_at && (
              <div className="text-sm text-green-600">
                Last success: {new Date(webhook.last_success_at).toLocaleString()}
              </div>
            )}
            {webhook.last_error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  <strong>Last Error:</strong> {webhook.last_error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook_url">n8n Webhook URL *</Label>
            <Input
              id="webhook_url"
              name="webhook_url"
              type="url"
              placeholder="https://your-n8n-instance.com/webhook/..."
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret_key">Secret Key (Optional)</Label>
            <Input
              id="secret_key"
              name="secret_key"
              type="password"
              placeholder="Optional signature verification key"
              value={formData.secret_key}
              onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              If provided, will be sent as X-Webhook-Signature header
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled" className="cursor-pointer">
                Enable webhook
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving || !formData.webhook_url}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>

            {webhook && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting || !webhook.enabled}
                >
                  {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-2 h-4 w-4" />
                  Test Webhook
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isDeleting}>
                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Webhook Configuration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the webhook configuration. You won't be able to export
                        applications to n8n until you configure it again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteWebhook()}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </form>

        {/* Payload Example */}
        <div className="space-y-2">
          <Label>Example Payload Sent to n8n:</Label>
          <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "organization_id": "uuid",
  "export_timestamp": "2024-01-15T10:30:00Z",
  "total_applications": 25,
  "filters": {
    "status": "pending",
    "source": "Direct Application"
  },
  "applications": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "applicant_email": "john@example.com",
      "phone": "+1234567890",
      "status": "pending",
      "source": "Direct Application",
      "job_listings": {
        "title": "CDL Driver",
        "location": "Dallas, TX"
      }
      // ... additional fields
    }
  ]
}`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
