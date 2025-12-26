import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Settings, MapPin, User, TestTube, Loader2, CheckCircle, XCircle, Phone } from 'lucide-react';
import { AVAILABLE_FIELD_TYPES } from '@/types/tenstreet';
import { useAuth } from '@/hooks/useAuth';

const DriverReachIntegration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  // DriverReach Configuration
  const [config, setConfig] = useState({
    apiKey: '',
    companyId: '',
    apiEndpoint: 'https://api.driverreach.com/v1',
    mode: 'PROD',
    source: '3BI',
    companyName: '',
  });

  // Personal Data Field Mappings (same structure as Tenstreet)
  const [personalDataMappings, setPersonalDataMappings] = useState({
    givenName: 'first_name',
    middleName: 'middle_name',
    familyName: 'last_name',
    municipality: 'city',
    region: 'state',
    postalCode: 'zip',
    address1: 'address_1',
    address2: 'address_2',
    dateOfBirth: 'date_of_birth',
    internetEmailAddress: 'applicant_email',
    primaryPhone: 'phone',
    secondaryPhone: 'secondary_phone',
  });

  // Fetch existing credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery({
    queryKey: ['driverreach-credentials', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('driverreach_credentials')
        .select('*')
        .eq('organization_id', organization.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Fetch existing field mappings
  const { data: fieldMappings, isLoading: mappingsLoading } = useQuery({
    queryKey: ['driverreach-mappings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('driverreach_field_mappings')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('is_default', true)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Load existing configuration
  useEffect(() => {
    if (credentials) {
      setConfig({
        apiKey: credentials.api_key || '',
        companyId: credentials.company_id || '',
        apiEndpoint: credentials.api_endpoint || 'https://api.driverreach.com/v1',
        mode: credentials.mode || 'PROD',
        source: credentials.source || '3BI',
        companyName: credentials.company_name || '',
      });
    }
  }, [credentials]);

  useEffect(() => {
    if (fieldMappings?.field_mappings) {
      const mappings = fieldMappings.field_mappings as Record<string, unknown>;
      if (mappings.personalData) {
        setPersonalDataMappings(prev => ({
          ...prev,
          ...(mappings.personalData as Record<string, string>),
        }));
      }
    }
  }, [fieldMappings]);

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization found');

      const credentialData = {
        organization_id: organization.id,
        api_key: config.apiKey,
        company_id: config.companyId,
        api_endpoint: config.apiEndpoint,
        mode: config.mode,
        source: config.source,
        company_name: config.companyName,
        status: 'inactive',
      };

      if (credentials?.id) {
        const { error } = await supabase
          .from('driverreach_credentials')
          .update(credentialData)
          .eq('id', credentials.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('driverreach_credentials')
          .insert(credentialData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverreach-credentials'] });
      toast({ title: 'Credentials saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save credentials', description: error.message, variant: 'destructive' });
    },
  });

  // Save field mappings mutation
  const saveMappingsMutation = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization found');

      const mappingData = {
        organization_id: organization.id,
        name: 'Default',
        field_mappings: { personalData: personalDataMappings },
        is_default: true,
      };

      if (fieldMappings?.id) {
        const { error } = await supabase
          .from('driverreach_field_mappings')
          .update(mappingData)
          .eq('id', fieldMappings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('driverreach_field_mappings')
          .insert(mappingData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driverreach-mappings'] });
      toast({ title: 'Field mappings saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save mappings', description: error.message, variant: 'destructive' });
    },
  });

  const handleSaveConfig = () => {
    saveCredentialsMutation.mutate();
    saveMappingsMutation.mutate();
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('driverreach-integration', {
        body: {
          action: 'test_connection',
          config: {
            apiKey: config.apiKey,
            companyId: config.companyId,
            apiEndpoint: config.apiEndpoint,
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        // Update status to active
        if (credentials?.id) {
          await supabase
            .from('driverreach_credentials')
            .update({ status: 'active' })
            .eq('id', credentials.id);
          queryClient.invalidateQueries({ queryKey: ['driverreach-credentials'] });
        }
        toast({ title: 'Connection Successful', description: 'Successfully connected to DriverReach API.' });
      } else {
        toast({ title: 'Connection Failed', description: data?.message || 'Failed to connect', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Connection Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Enable feature mutation
  const enableFeatureMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!organization?.id) throw new Error('No organization found');

      const { error } = await supabase
        .from('organization_features')
        .upsert({
          organization_id: organization.id,
          feature_name: 'driverreach_access',
          enabled,
        }, { onConflict: 'organization_id,feature_name' });

      if (error) throw error;
    },
    onSuccess: (_, enabled) => {
      toast({ title: enabled ? 'DriverReach Auto-Post Enabled' : 'DriverReach Auto-Post Disabled' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update feature', description: error.message, variant: 'destructive' });
    },
  });

  // Fetch feature status
  const { data: featureEnabled } = useQuery({
    queryKey: ['driverreach-feature', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return false;
      const { data } = await supabase
        .from('organization_features')
        .select('enabled')
        .eq('organization_id', organization.id)
        .eq('feature_name', 'driverreach_access')
        .maybeSingle();
      return data?.enabled ?? false;
    },
    enabled: !!organization?.id,
  });

  const renderFieldSelect = (value: string, onChange: (value: string) => void, placeholder = "Select field") => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">-- None --</SelectItem>
        {AVAILABLE_FIELD_TYPES.map(field => (
          <SelectItem key={field} value={field}>{field}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const isLoading = credentialsLoading || mappingsLoading;
  const isSaving = saveCredentialsMutation.isPending || saveMappingsMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">DriverReach Integration</h1>
          <p className="text-muted-foreground mt-1">Configure DriverReach ATS integration for automatic application posting</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestConnection} variant="outline" disabled={isTestingConnection || isLoading}>
            {isTestingConnection ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TestTube className="w-4 h-4 mr-2" />}
            Test Connection
          </Button>
          <Button onClick={handleSaveConfig} disabled={isSaving || isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${credentials?.status === 'active' ? 'bg-green-500/20' : 'bg-muted'}`}>
                {credentials?.status === 'active' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-medium">Connection Status</h3>
                <p className="text-sm text-muted-foreground">
                  {credentials?.status === 'active' ? 'Connected to DriverReach' : 'Not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="auto-post">Auto-Post Applications</Label>
              <Switch
                id="auto-post"
                checked={featureEnabled ?? false}
                onCheckedChange={(checked) => enableFeatureMutation.mutate(checked)}
                disabled={credentials?.status !== 'active'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">API Config</TabsTrigger>
          <TabsTrigger value="personal-info">Personal Info</TabsTrigger>
          <TabsTrigger value="address-contact">Address & Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                DriverReach API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    placeholder="Your DriverReach API Key"
                  />
                </div>
                <div>
                  <Label htmlFor="companyId">Company ID</Label>
                  <Input
                    id="companyId"
                    value={config.companyId}
                    onChange={(e) => setConfig({...config, companyId: e.target.value})}
                    placeholder="Your DriverReach Company ID"
                  />
                </div>
                <div>
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={config.apiEndpoint}
                    onChange={(e) => setConfig({...config, apiEndpoint: e.target.value})}
                    placeholder="https://api.driverreach.com/v1"
                  />
                </div>
                <div>
                  <Label htmlFor="mode">Mode</Label>
                  <Select value={config.mode} onValueChange={(value) => setConfig({...config, mode: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROD">Production</SelectItem>
                      <SelectItem value="TEST">Test</SelectItem>
                      <SelectItem value="DEV">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={config.source}
                    onChange={(e) => setConfig({...config, source: e.target.value})}
                    placeholder="3BI"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={config.companyName}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                    placeholder="Your Company Name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name *</Label>
                  {renderFieldSelect(
                    personalDataMappings.givenName,
                    (value) => setPersonalDataMappings({...personalDataMappings, givenName: value})
                  )}
                </div>
                <div>
                  <Label>Middle Name</Label>
                  {renderFieldSelect(
                    personalDataMappings.middleName,
                    (value) => setPersonalDataMappings({...personalDataMappings, middleName: value})
                  )}
                </div>
                <div>
                  <Label>Last Name *</Label>
                  {renderFieldSelect(
                    personalDataMappings.familyName,
                    (value) => setPersonalDataMappings({...personalDataMappings, familyName: value})
                  )}
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  {renderFieldSelect(
                    personalDataMappings.dateOfBirth,
                    (value) => setPersonalDataMappings({...personalDataMappings, dateOfBirth: value})
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address-contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Address Line 1</Label>
                  {renderFieldSelect(
                    personalDataMappings.address1,
                    (value) => setPersonalDataMappings({...personalDataMappings, address1: value})
                  )}
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  {renderFieldSelect(
                    personalDataMappings.address2,
                    (value) => setPersonalDataMappings({...personalDataMappings, address2: value})
                  )}
                </div>
                <div>
                  <Label>City *</Label>
                  {renderFieldSelect(
                    personalDataMappings.municipality,
                    (value) => setPersonalDataMappings({...personalDataMappings, municipality: value})
                  )}
                </div>
                <div>
                  <Label>State *</Label>
                  {renderFieldSelect(
                    personalDataMappings.region,
                    (value) => setPersonalDataMappings({...personalDataMappings, region: value})
                  )}
                </div>
                <div>
                  <Label>ZIP Code *</Label>
                  {renderFieldSelect(
                    personalDataMappings.postalCode,
                    (value) => setPersonalDataMappings({...personalDataMappings, postalCode: value})
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email Address *</Label>
                  {renderFieldSelect(
                    personalDataMappings.internetEmailAddress,
                    (value) => setPersonalDataMappings({...personalDataMappings, internetEmailAddress: value})
                  )}
                </div>
                <div>
                  <Label>Primary Phone</Label>
                  {renderFieldSelect(
                    personalDataMappings.primaryPhone,
                    (value) => setPersonalDataMappings({...personalDataMappings, primaryPhone: value})
                  )}
                </div>
                <div>
                  <Label>Secondary Phone</Label>
                  {renderFieldSelect(
                    personalDataMappings.secondaryPhone,
                    (value) => setPersonalDataMappings({...personalDataMappings, secondaryPhone: value})
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverReachIntegration;
