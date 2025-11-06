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
import { TENSTREET_API_ENDPOINTS } from '@/types/tenstreet/api-contracts';

interface TenstreetCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOrganizationId?: string | null;
}

const TenstreetCredentialsDialog: React.FC<TenstreetCredentialsDialogProps> = ({
  open,
  onOpenChange,
  initialOrganizationId,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(initialOrganizationId || null);
  const [config, setConfig] = useState({
    account_name: '',
    client_id: '',
    password: '', // Changed from password_encrypted
    service: 'subject_upload',
    mode: 'PROD',
    api_endpoint: '/api/auth/login',
    source: '',
    company_name: '',
    app_referrer: '3BI'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization, userRole } = useAuth();

  // Update selectedOrganizationId when initialOrganizationId changes
  React.useEffect(() => {
    if (initialOrganizationId) {
      setSelectedOrganizationId(initialOrganizationId);
    }
  }, [initialOrganizationId]);

  // Determine effective organization ID
  const effectiveOrgId = userRole === 'super_admin' ? selectedOrganizationId : organization?.id;

  // Fetch organizations list (only for super admins)
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === 'super_admin' && open,
  });

  // Fetch existing credentials
  const { data: credentials, isLoading } = useQuery({
    queryKey: ['tenstreet-credentials', effectiveOrgId],
    queryFn: async () => {
      if (!effectiveOrgId) return null;
      
      const { data, error } = await supabase
        .from('tenstreet_credentials')
        .select('*')
        .eq('organization_id', effectiveOrgId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!effectiveOrgId && open,
  });

  // Load credentials into form when fetched
  useEffect(() => {
    if (credentials) {
      setConfig({
        account_name: credentials.account_name || '',
        client_id: credentials.client_id || '',
        password: credentials.password || '', // Changed from password_encrypted
        service: credentials.service || 'subject_upload',
        mode: credentials.mode || 'PROD',
        api_endpoint: credentials.api_endpoint || '/api/auth/login',
        source: credentials.source || '',
        company_name: credentials.company_name || '',
        app_referrer: credentials.app_referrer || '3BI'
      });
    }
  }, [credentials]);

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveOrgId) {
        throw new Error(
          userRole === 'super_admin' 
            ? 'Please select an organization to configure' 
            : 'No organization ID'
        );
      }

      const credData = {
        organization_id: effectiveOrgId,
        account_name: config.account_name,
        client_id: config.client_id,
        password: config.password, // Changed from password_encrypted
        service: config.service,
        mode: config.mode,
        api_endpoint: config.api_endpoint,
        source: config.source,
        company_name: config.company_name,
        app_referrer: config.app_referrer,
        status: 'active'
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
      // Invalidate all Tenstreet-related queries to refresh all dashboards
      queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials-management'] });
      queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials-summary'] });
      
      toast({
        title: 'Credentials Saved ✓',
        description: 'Tenstreet credentials have been saved successfully.',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Failed to save credentials:', {
        error,
        effectiveOrgId,
        config: { ...config, password: '***' }, // Don't log password
        userRole
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to save credentials.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    // Validate all required fields
    const missingFields = [];
    if (!config.account_name?.trim()) missingFields.push('Account Name');
    if (!config.client_id?.trim()) missingFields.push('Client ID');
    if (!config.password?.trim()) missingFields.push('Password'); // Changed from password_encrypted
    if (!config.api_endpoint?.trim()) missingFields.push('API Endpoint');
    
    if (missingFields.length > 0) {
      toast({
        title: 'Missing Required Fields',
        description: `Please fill in: ${missingFields.join(', ')}`,
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
            password: config.password, // Changed from password_encrypted
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
    onSuccess: async (data) => {
      if (data.success) {
        // Update status to 'active' if we have saved credentials
        if (credentials?.id && effectiveOrgId) {
          try {
            const { error } = await supabase
              .from('tenstreet_credentials')
              .update({ 
                status: 'active', 
                updated_at: new Date().toISOString() 
              })
              .eq('id', credentials.id);
            
            if (error) {
              console.error('Failed to update credential status:', error);
            } else {
              // Invalidate queries to refresh the UI
              queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials'] });
              queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials-management'] });
              queryClient.invalidateQueries({ queryKey: ['tenstreet-credentials-summary'] });
            }
          } catch (err) {
            console.error('Error updating credential status:', err);
          }
        }
        
        toast({
          title: 'Connection Successful ✓',
          description: 'Successfully connected to Tenstreet API. Status updated to Active.',
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
      console.error('Connection test failed:', {
        error,
        config: { ...config, password: '***' } // Don't log password
      });
      
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
            {userRole === 'super_admin' && (
              <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label htmlFor="organization_select" className="text-base font-semibold mb-2">
                  Select Organization *
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Choose which organization to configure Tenstreet credentials for
                </p>
                <Select 
                  value={selectedOrganizationId || ''} 
                  onValueChange={setSelectedOrganizationId}
                >
                  <SelectTrigger id="organization_select" className="bg-background">
                    <SelectValue placeholder="Choose organization to configure..." />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
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
                <Label htmlFor="mode">Environment Mode *</Label>
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

              <div className="space-y-2 col-span-2">
                <Label htmlFor="api_endpoint">API Endpoint *</Label>
                <Select
                  value={config.api_endpoint}
                  onValueChange={(value) => setConfig({ ...config, api_endpoint: value })}
                >
                  <SelectTrigger id="api_endpoint">
                    <SelectValue placeholder="Select Tenstreet API endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {TENSTREET_API_ENDPOINTS.map((endpoint) => (
                      <SelectItem key={endpoint.value} value={endpoint.value}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-sm">{endpoint.label}</span>
                          <span className="text-xs text-muted-foreground">{endpoint.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {TENSTREET_API_ENDPOINTS.find(e => e.value === config.api_endpoint)?.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending || !config.client_id || !config.password}
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
