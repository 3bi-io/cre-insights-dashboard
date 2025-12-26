import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Settings, Trash2, CheckCircle, XCircle, Loader2, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';
import {
  useBackgroundCheckProviders,
  useBackgroundCheckConnections,
  useCreateBGCConnection,
  useUpdateBGCConnection,
  useDeleteBGCConnection,
  useTestBGCConnection
} from '../hooks/useBackgroundChecks';
import type { BGCProvider, BGCConnection } from '../services/BackgroundCheckService';

interface BGCProviderConnectionsProps {
  organizationId: string;
}

// Credential field configurations for each provider
const PROVIDER_CREDENTIAL_FIELDS: Record<string, { key: string; label: string; type?: string; placeholder?: string }[]> = {
  checkr: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your Checkr API key' }
  ],
  sterling: [
    { key: 'client_id', label: 'Client ID', placeholder: 'Enter your Sterling Client ID' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Enter your Sterling Client Secret' }
  ],
  hireright: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your HireRight API key' },
    { key: 'account_id', label: 'Account ID', placeholder: 'Enter your HireRight Account ID' }
  ],
  goodhire: [
    { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter your GoodHire API key' }
  ],
  accurate: [
    { key: 'client_id', label: 'Client ID', placeholder: 'Enter your Accurate Client ID' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'Enter your Accurate Client Secret' }
  ]
};

export function BGCProviderConnections({ organizationId }: BGCProviderConnectionsProps) {
  const { data: providers, isLoading: loadingProviders } = useBackgroundCheckProviders();
  const { data: connections, isLoading: loadingConnections } = useBackgroundCheckConnections(organizationId);
  const createConnection = useCreateBGCConnection();
  const updateConnection = useUpdateBGCConnection();
  const deleteConnection = useDeleteBGCConnection();
  const testConnection = useTestBGCConnection();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isDefault, setIsDefault] = useState(false);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  // Get providers that don't have a connection yet
  const availableProviders = providers?.filter(
    p => !connections?.some(c => c.provider_id === p.id)
  ) || [];

  const handleAddConnection = async () => {
    if (!selectedProvider) {
      toast.error('Please select a provider');
      return;
    }

    const provider = providers?.find(p => p.id === selectedProvider);
    if (!provider) return;

    const requiredFields = PROVIDER_CREDENTIAL_FIELDS[provider.slug] || [];
    const missingFields = requiredFields.filter(f => !credentials[f.key]?.trim());
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    try {
      await createConnection.mutateAsync({
        organizationId,
        providerId: selectedProvider,
        credentials,
        options: { isDefault }
      });
      setShowAddDialog(false);
      setSelectedProvider('');
      setCredentials({});
      setIsDefault(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    setTestingConnectionId(connectionId);
    try {
      await testConnection.mutateAsync(connectionId);
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleDeleteConnection = async (connectionId: string, providerName: string) => {
    if (!confirm(`Are you sure you want to remove the ${providerName} connection?`)) {
      return;
    }
    await deleteConnection.mutateAsync(connectionId);
  };

  const handleToggleEnabled = async (connection: BGCConnection) => {
    await updateConnection.mutateAsync({
      connectionId: connection.id,
      updates: { isEnabled: !connection.is_enabled }
    });
  };

  const handleSetDefault = async (connection: BGCConnection) => {
    await updateConnection.mutateAsync({
      connectionId: connection.id,
      updates: { isDefault: true }
    });
  };

  if (loadingProviders || loadingConnections) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const selectedProviderData = providers?.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Background Check Providers</h3>
          <p className="text-sm text-muted-foreground">
            Connect to background check providers for direct API integration
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button disabled={availableProviders.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Connect Provider</DialogTitle>
              <DialogDescription>
                Add API credentials to connect a background check provider
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={selectedProvider} onValueChange={(v) => {
                  setSelectedProvider(v);
                  setCredentials({});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProviders.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProviderData && (
                <>
                  {PROVIDER_CREDENTIAL_FIELDS[selectedProviderData.slug]?.map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <Input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        value={credentials[field.key] || ''}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          [field.key]: e.target.value
                        }))}
                      />
                    </div>
                  ))}

                  <div className="flex items-center justify-between">
                    <Label htmlFor="default-provider">Set as default provider</Label>
                    <Switch
                      id="default-provider"
                      checked={isDefault}
                      onCheckedChange={setIsDefault}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddConnection}
                disabled={createConnection.isPending || !selectedProvider}
              >
                {createConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {connections && connections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {connections.map(connection => (
            <Card key={connection.id} className={!connection.is_enabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {connection.provider?.logo_url ? (
                      <img 
                        src={connection.provider.logo_url} 
                        alt={connection.provider?.name} 
                        className="h-8 w-8 rounded"
                      />
                    ) : (
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-base">{connection.provider?.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Connected {new Date(connection.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {connection.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    {connection.is_enabled ? (
                      <Badge variant="default" className="bg-green-600 text-xs">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {connection.provider?.supported_checks.slice(0, 4).map(check => (
                    <Badge key={check} variant="outline" className="text-xs">
                      {check}
                    </Badge>
                  ))}
                  {(connection.provider?.supported_checks.length || 0) > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{(connection.provider?.supported_checks.length || 0) - 4}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection(connection.id)}
                    disabled={testingConnectionId === connection.id}
                  >
                    {testingConnectionId === connection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span className="ml-1">Test</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleEnabled(connection)}
                  >
                    {connection.is_enabled ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span className="ml-1">{connection.is_enabled ? 'Disable' : 'Enable'}</span>
                  </Button>

                  {!connection.is_default && connection.is_enabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(connection)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="ml-1">Set Default</span>
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive hover:text-destructive"
                    onClick={() => handleDeleteConnection(connection.id, connection.provider?.name || 'Provider')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-medium mb-2">No providers connected</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Connect a background check provider to start running checks directly through their API
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Your First Provider
          </Button>
        </Card>
      )}

      {/* Available Providers Reference */}
      {availableProviders.length > 0 && connections && connections.length > 0 && (
        <div className="mt-8">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Available to Connect</h4>
          <div className="flex flex-wrap gap-2">
            {availableProviders.map(provider => (
              <Button
                key={provider.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProvider(provider.id);
                  setShowAddDialog(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                {provider.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BGCProviderConnections;
