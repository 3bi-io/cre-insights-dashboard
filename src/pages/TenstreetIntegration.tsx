import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Settings, MapPin, User, FileText, Plus, X, TestTube, Users, UserCheck, CreditCard, Phone, LayoutDashboard, ArrowRight } from 'lucide-react';
import { AVAILABLE_FIELD_TYPES } from '@/types/tenstreet';
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';
import { TenstreetQuickActions } from '@/components/tenstreet/TenstreetQuickActions';

const TenstreetIntegration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { credentials, fieldMappings, isLoading: configLoading, saveCredentials, saveFieldMappings, isSaving } = useTenstreetConfiguration();
  
  // Tenstreet Configuration
  const [config, setConfig] = useState({
    clientId: '',
    password: '',
    service: '',
    mode: '',
    source: '',
    companyId: '',
    companyName: '',
    driverId: '',
    jobId: '',
    statusTag: '',
    appReferrer: ''
  });

  // Enhanced Personal Data Field Mappings
  const [personalDataMappings, setPersonalDataMappings] = useState({
    // PersonName fields
    prefix: '',
    givenName: '',
    middleName: '',
    familyName: '',
    affix: '',
    
    // PostalAddress fields
    countryCode: '',
    municipality: '',
    region: '',
    postalCode: '',
    address1: '',
    address2: '',
    
    // GovernmentID fields
    governmentId: '',
    governmentIdCountryCode: '',
    governmentIdIssuingAuthority: '',
    governmentIdDocumentType: '',
    
    // Contact and personal data
    dateOfBirth: '',
    internetEmailAddress: '',
    primaryPhone: '',
    secondaryPhone: '',
    preferredMethod: ''
  });

  const [customQuestions, setCustomQuestions] = useState([]);

  const [displayFields, setDisplayFields] = useState([]);

  // Load existing configuration
  useEffect(() => {
    if (credentials) {
      setConfig({
        clientId: credentials.client_id || '',
        password: credentials.password || '', // Changed from password_encrypted
        service: credentials.service || 'subject_upload',
        mode: credentials.mode || 'PROD',
        source: credentials.source || '3BI',
        companyId: credentials.company_ids?.[0] || '',
        companyName: credentials.company_name || '',
        driverId: '',
        jobId: '',
        statusTag: 'Status=New Applicant',
        appReferrer: credentials.app_referrer || '3BI',
      });
    }
  }, [credentials]);

  useEffect(() => {
    if (fieldMappings?.field_mappings) {
      const mappings = fieldMappings.field_mappings as any;
      if (mappings.personalData) {
        setPersonalDataMappings(mappings.personalData);
      }
      if (mappings.customQuestions) {
        setCustomQuestions(mappings.customQuestions);
      }
      if (mappings.displayFields) {
        setDisplayFields(mappings.displayFields);
      }
    }
  }, [fieldMappings]);

  const handleSaveConfig = () => {
    // Save both credentials and field mappings
    saveCredentials(config);
    saveFieldMappings({
      personalData: personalDataMappings,
      customQuestions,
      displayFields,
    });
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to test the Tenstreet connection.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('tenstreet-integration', {
        body: {
          action: 'test_connection',
          config
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Tenstreet API.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: `Failed to connect: ${data.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Tenstreet API. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      {
        questionId: `custom_${Date.now()}`,
        question: '',
        mapping: ''
      }
    ]);
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const addDisplayField = () => {
    setDisplayFields([
      ...displayFields,
      {
        displayPrompt: '',
        mapping: ''
      }
    ]);
  };

  const removeDisplayField = (index: number) => {
    setDisplayFields(displayFields.filter((_, i) => i !== index));
  };

  // Helper function to render field mapping select
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenstreet Integration</h1>
          <p className="text-muted-foreground mt-1">Configure comprehensive field mapping for Tenstreet driver applications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestConnection} variant="outline" disabled={isLoading || configLoading}>
            <TestTube className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
          <Button onClick={handleSaveConfig} disabled={isSaving || configLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="configuration">API Config</TabsTrigger>
          <TabsTrigger value="personal-name">Name</TabsTrigger>
          <TabsTrigger value="address-contact">Address & Contact</TabsTrigger>
          <TabsTrigger value="identification">Identification</TabsTrigger>
          <TabsTrigger value="custom-questions">Questions</TabsTrigger>
          <TabsTrigger value="display-fields">Display Fields</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Tenstreet API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                    placeholder="e.g. 123"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({...config, password: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="service">Service</Label>
                  <Input
                    id="service"
                    value={config.service}
                    onChange={(e) => setConfig({...config, service: e.target.value})}
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
                      <SelectItem value="DEV">Development</SelectItem>
                      <SelectItem value="TEST">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={config.source}
                    onChange={(e) => setConfig({...config, source: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="companyId">Company ID</Label>
                  <Input
                    id="companyId"
                    value={config.companyId}
                    onChange={(e) => setConfig({...config, companyId: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={config.companyName}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="driverId">Driver ID (Optional)</Label>
                  <Input
                    id="driverId"
                    value={config.driverId}
                    onChange={(e) => setConfig({...config, driverId: e.target.value})}
                    placeholder="Leave empty to auto-generate"
                  />
                </div>
                <div>
                  <Label htmlFor="jobId">Job ID (Optional)</Label>
                  <Input
                    id="jobId"
                    value={config.jobId}
                    onChange={(e) => setConfig({...config, jobId: e.target.value})}
                    placeholder="****"
                  />
                </div>
                <div>
                  <Label htmlFor="statusTag">Status Tag</Label>
                  <Input
                    id="statusTag"
                    value={config.statusTag}
                    onChange={(e) => setConfig({...config, statusTag: e.target.value})}
                    placeholder="Status=New Applicant"
                  />
                </div>
                <div>
                  <Label htmlFor="appReferrer">App Referrer</Label>
                  <Input
                    id="appReferrer"
                    value={config.appReferrer}
                    onChange={(e) => setConfig({...config, appReferrer: e.target.value})}
                    placeholder="3BI"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal-name" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                PersonName Field Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prefix (Mr., Mrs., Dr., etc.)</Label>
                  {renderFieldSelect(
                    personalDataMappings.prefix,
                    (value) => setPersonalDataMappings({...personalDataMappings, prefix: value})
                  )}
                </div>
                <div>
                  <Label>Given Name (First Name) *</Label>
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
                  <Label>Family Name (Last Name) *</Label>
                  {renderFieldSelect(
                    personalDataMappings.familyName,
                    (value) => setPersonalDataMappings({...personalDataMappings, familyName: value})
                  )}
                </div>
                <div>
                  <Label>Affix (Jr., Sr., III, etc.)</Label>
                  {renderFieldSelect(
                    personalDataMappings.affix,
                    (value) => setPersonalDataMappings({...personalDataMappings, affix: value})
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
                Address & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Postal Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Country Code</Label>
                    {renderFieldSelect(
                      personalDataMappings.countryCode,
                      (value) => setPersonalDataMappings({...personalDataMappings, countryCode: value}),
                      "Default: US"
                    )}
                  </div>
                  <div>
                    <Label>Municipality (City) *</Label>
                    {renderFieldSelect(
                      personalDataMappings.municipality,
                      (value) => setPersonalDataMappings({...personalDataMappings, municipality: value})
                    )}
                  </div>
                  <div>
                    <Label>Region (State) *</Label>
                    {renderFieldSelect(
                      personalDataMappings.region,
                      (value) => setPersonalDataMappings({...personalDataMappings, region: value})
                    )}
                  </div>
                  <div>
                    <Label>Postal Code (ZIP) *</Label>
                    {renderFieldSelect(
                      personalDataMappings.postalCode,
                      (value) => setPersonalDataMappings({...personalDataMappings, postalCode: value})
                    )}
                  </div>
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
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Data
                </h3>
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
                  <div>
                    <Label>Preferred Contact Method</Label>
                    <Select 
                      value={personalDataMappings.preferredMethod} 
                      onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, preferredMethod: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Default: PrimaryPhone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">-- Auto Select --</SelectItem>
                        <SelectItem value="PrimaryPhone">Primary Phone</SelectItem>
                        <SelectItem value="SecondaryPhone">Secondary Phone</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="identification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Identification & Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Government ID (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Government ID (SSN)</Label>
                    {renderFieldSelect(
                      personalDataMappings.governmentId,
                      (value) => setPersonalDataMappings({...personalDataMappings, governmentId: value})
                    )}
                  </div>
                  <div>
                    <Label>Country Code</Label>
                    {renderFieldSelect(
                      personalDataMappings.governmentIdCountryCode,
                      (value) => setPersonalDataMappings({...personalDataMappings, governmentIdCountryCode: value}),
                      "Default: US"
                    )}
                  </div>
                  <div>
                    <Label>Issuing Authority</Label>
                    {renderFieldSelect(
                      personalDataMappings.governmentIdIssuingAuthority,
                      (value) => setPersonalDataMappings({...personalDataMappings, governmentIdIssuingAuthority: value}),
                      "Default: SSA"
                    )}
                  </div>
                  <div>
                    <Label>Document Type</Label>
                    {renderFieldSelect(
                      personalDataMappings.governmentIdDocumentType,
                      (value) => setPersonalDataMappings({...personalDataMappings, governmentIdDocumentType: value}),
                      "Default: SSN"
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date of Birth</Label>
                    {renderFieldSelect(
                      personalDataMappings.dateOfBirth,
                      (value) => setPersonalDataMappings({...personalDataMappings, dateOfBirth: value})
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-questions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Custom Questions Mapping
                <Button onClick={addCustomQuestion} size="sm" variant="outline" className="ml-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customQuestions.map((question, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label>Question ID</Label>
                      <Input
                        value={question.questionId}
                        onChange={(e) => {
                          const updated = [...customQuestions];
                          updated[index].questionId = e.target.value;
                          setCustomQuestions(updated);
                        }}
                        placeholder="Question ID"
                      />
                    </div>
                  </div>
                  <div className="flex-2">
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Input
                        value={question.question}
                        onChange={(e) => {
                          const updated = [...customQuestions];
                          updated[index].question = e.target.value;
                          setCustomQuestions(updated);
                        }}
                        placeholder="Question text"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label>Field Mapping</Label>
                      {renderFieldSelect(
                        question.mapping,
                        (value) => {
                          const updated = [...customQuestions];
                          updated[index].mapping = value;
                          setCustomQuestions(updated);
                        }
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => removeCustomQuestion(index)} 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display-fields" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Display Fields Mapping
                <Button onClick={addDisplayField} size="sm" variant="outline" className="ml-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayFields.map((field, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label>Display Prompt</Label>
                      <Input
                        value={field.displayPrompt}
                        onChange={(e) => {
                          const updated = [...displayFields];
                          updated[index].displayPrompt = e.target.value;
                          setDisplayFields(updated);
                        }}
                        placeholder="Display prompt"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <Label>Field Mapping</Label>
                      {renderFieldSelect(
                        field.mapping,
                        (value) => {
                          const updated = [...displayFields];
                          updated[index].mapping = value;
                          setDisplayFields(updated);
                        }
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => removeDisplayField(index)} 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenstreetIntegration;