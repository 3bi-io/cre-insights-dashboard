import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Save, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface TenstreetCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TenstreetCredentialsDialog: React.FC<TenstreetCredentialsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState({
    account_name: '',
    client_id: '',
    password_encrypted: '',
    service: 'subject_upload',
    mode: 'PROD',
    source: '',
    company_name: '',
    app_referrer: '3BI'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  // Fetch existing credentials
  const { data: credentials, isLoading } = useQuery({
    queryKey: ['tenstreet-credentials', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      
      const { data, error } = await supabase
        .from('tenstreet_credentials')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id && open,
  });

  // Load credentials into form when fetched
  useEffect(() => {
    if (credentials) {
      setConfig({
        account_name: credentials.account_name || '',
        client_id: credentials.client_id || '',
        password_encrypted: credentials.password_encrypted || '',
        service: credentials.service || 'subject_upload',
        mode: credentials.mode || 'PROD',
        source: credentials.source || '',
        company_name: credentials.company_name || '',
        app_referrer: credentials.app_referrer || '3BI'
      });
    }
  }, [credentials]);

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization ID');

      const credData = {
        organization_id: organization.id,
        ...config
      };

      if (credentials) {
        // Update existing
        const { error } = await supabase
          .from('tenstreet_credentials')
          .update(credData)
          .eq('id', credentials.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('tenstreet_credentials')
          .insert(credData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials'] });
      toast({
        title: 'Credentials Saved',
        description: 'Tenstreet credentials have been saved successfully.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save credentials.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!config.client_id || !config.password_encrypted) {
      toast({
        title: 'Missing Fields',
        description: 'Client ID and Password are required.',
        variant: 'destructive',
      });
      return;
    }
    saveCredentialsMutation.mutate();
  };

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error} = await supabase.functions.invoke('tenstreet-integration', {
        body: {
          action: 'test_connection',
          config: {
            clientId: config.client_id,
            password: config.password_encrypted,
            service: config.service,
            mode: config.mode,
            source: config.source,
            companyName: config.company_name,
            appReferrer: config.app_referrer
          }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Connection Successful',
          description: 'Successfully connected to Tenstreet API.',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || 'Failed to connect to Tenstreet.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Connection Test Failed',
        description: error.message || 'Failed to test connection.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="tenstreet-credentials-description">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Tenstreet API Credentials</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure organization-wide Tenstreet ATS integration
              </p>
            </div>
          </div>
          <div id="tenstreet-credentials-description" className="sr-only">
            Configure and manage Tenstreet API credentials for your organization
          </div>
        </DialogHeader>

        <Card className="border-border/40">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name *</Label>
                <Input
                  id="account_name"
                  value={config.account_name}
                  onChange={(e) => setConfig({ ...config, account_name: e.target.value })}
                  placeholder="Enter account name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID *</Label>
                <Input
                  id="client_id"
                  value={config.client_id}
                  onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                  placeholder="Enter Tenstreet Client ID"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="password">API Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={config.password_encrypted}
                    onChange={(e) => setConfig({ ...config, password_encrypted: e.target.value })}
                    placeholder="Enter API password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={config.company_name}
                  onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={config.source}
                  onChange={(e) => setConfig({ ...config, source: e.target.value })}
                  placeholder="e.g., 3BI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service</Label>
                <Input
                  id="service"
                  value={config.service}
                  onChange={(e) => setConfig({ ...config, service: e.target.value })}
                  placeholder="subject_upload"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Environment Mode</Label>
                <Select value={config.mode} onValueChange={(value) => setConfig({ ...config, mode: value })}>
                  <SelectTrigger id="mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROD">Production</SelectItem>
                    <SelectItem value="TEST">Test</SelectItem>
                    <SelectItem value="DEV">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="app_referrer">App Referrer</Label>
                <Input
                  id="app_referrer"
                  value={config.app_referrer}
                  onChange={(e) => setConfig({ ...config, app_referrer: e.target.value })}
                  placeholder="3BI"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !config.client_id || !config.password_encrypted}
                variant="outline"
                className="flex-1"
              >
                {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveCredentialsMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveCredentialsMutation.isPending ? 'Saving...' : 'Save Credentials'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          * Required fields. These credentials will be used for all Tenstreet integrations in your organization.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default TenstreetCredentialsDialog;
