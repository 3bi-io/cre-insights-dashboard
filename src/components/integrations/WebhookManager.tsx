import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ExternalLink, Activity, Webhook } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { OrganizationWebhookConfig } from '@/components/webhooks/OrganizationWebhookConfig';

interface WebhookConfig {
  id: string;
  user_id: string;
  organization_id: string;
  webhook_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  organizations?: {
    name: string;
    slug: string;
  };
}

export const WebhookManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [formData, setFormData] = useState({
    webhook_url: '',
    organization_id: '',
    enabled: true,
  });

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*, organizations(name, slug)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookConfig[];
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations-for-webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('webhook_configurations')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook created successfully' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create webhook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('webhook_configurations')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook updated successfully' });
      setIsDialogOpen(false);
      setEditingWebhook(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update webhook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook deleted successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete webhook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (webhook: WebhookConfig) => {
      const { data, error } = await supabase.functions.invoke('trigger-webhook', {
        body: {
          webhook_id: webhook.id,
          test_mode: true,
          payload: {
            timestamp: new Date().toISOString(),
            test: true,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Test webhook sent successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to test webhook',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      webhook_url: '',
      organization_id: '',
      enabled: true,
    });
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      webhook_url: webhook.webhook_url,
      organization_id: webhook.organization_id,
      enabled: webhook.enabled,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingWebhook) {
      updateMutation.mutate({ id: editingWebhook.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure webhooks to receive application data in your external systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inbound" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbound">Inbound Webhooks</TabsTrigger>
              <TabsTrigger value="outbound">n8n Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inbound" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Inbound Webhooks</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive real-time application data as it's submitted
                  </p>
                </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingWebhook(null); resetForm(); }}>
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
                Configure a webhook to send data to external services
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Select
                  value={formData.organization_id}
                  onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="webhook_url">Webhook URL (Zapier or other)</Label>
                <Input
                  id="webhook_url"
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get this from your Zapier webhook trigger or other service
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingWebhook(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWebhook ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {webhooks?.map((webhook) => (
          <Card key={webhook.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{webhook.organizations?.name || 'Webhook'}</CardTitle>
                    <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                      {webhook.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testMutation.mutate(webhook)}
                    disabled={!webhook.enabled || testMutation.isPending}
                  >
                    <Activity className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(webhook)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-medium">{webhook.organizations?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">URL:</span>
                  <a
                    href={webhook.webhook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 truncate max-w-md"
                  >
                    {webhook.webhook_url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {webhooks?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No webhooks configured yet</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>

    <TabsContent value="outbound" className="space-y-4 mt-4">
      <OrganizationWebhookConfig />
    </TabsContent>
  </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};