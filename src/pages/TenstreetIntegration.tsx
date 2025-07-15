import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Settings, MapPin, User, FileText, Plus, X, TestTube } from 'lucide-react';

const TenstreetIntegration = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Tenstreet Configuration
  const [config, setConfig] = useState({
    clientId: '303',
    password: 'lS%!r3pjy@0SzMs!8Ln',
    service: 'subject_upload',
    mode: 'PROD',
    source: 'TheDriverBoardLead',
    companyId: '1300',
    companyName: 'C.R. England'
  });

  // Field Mappings
  const [personalDataMappings, setPersonalDataMappings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    municipality: '',
    region: '',
    postalCode: ''
  });

  const [customQuestions, setCustomQuestions] = useState([
    {
      id: 'Class_A_CDL',
      question: 'Do you have a Class A CDL?',
      mapping: ''
    },
    {
      id: 'Veteran_Status',
      question: 'Are you a veteran?',
      mapping: ''
    },
    {
      id: 'Class_A_CDL_experience',
      question: 'How many months of Class A CDL experience do you have?',
      mapping: ''
    },
    {
      id: 'agree_privacy_policy',
      question: 'I agree to C.R. England\'s Privacy Policy.',
      mapping: ''
    },
    {
      id: 'consentToSMS',
      question: 'Do you consent to (SMS) messages from or on behalf of C.R. England?',
      mapping: ''
    },
    {
      id: 'over_21',
      question: 'Are you 21 or older?',
      mapping: ''
    },
    {
      id: 'can_pass_drug',
      question: 'Can you pass a DOT drug test?',
      mapping: ''
    }
  ]);

  const [displayFields, setDisplayFields] = useState([
    {
      prompt: 'Experience (months):',
      mapping: ''
    },
    {
      prompt: 'Job Code:(months):',
      mapping: ''
    }
  ]);

  // Sample field options (these would come from your form/application data)
  const availableFields = [
    'first_name',
    'last_name', 
    'email',
    'phone',
    'state',
    'zip_code',
    'city',
    'do_you_have_a_class_a_cdl?',
    'are_you_a_veteran?',
    'how_many_months_of_class_a_driving_experience_do_you_have?',
    'are_you_21_or_older?',
    'are_you_able_to_pass_a_dot_drug_test?',
    'i_agree_to_privacy_policy'
  ];

  const handleSaveConfig = () => {
    setIsLoading(true);
    // Save configuration logic here
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configuration Saved",
        description: "Tenstreet integration settings have been saved successfully.",
      });
    }, 1000);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-integration', {
        body: {
          action: 'test_connection',
          config
        }
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
        id: `custom_${Date.now()}`,
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
        prompt: '',
        mapping: ''
      }
    ]);
  };

  const removeDisplayField = (index: number) => {
    setDisplayFields(displayFields.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenstreet Integration</h1>
          <p className="text-muted-foreground mt-1">Configure field mapping for Tenstreet driver applications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestConnection} variant="outline" disabled={isLoading}>
            <TestTube className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
          <Button onClick={handleSaveConfig} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="personal-data">Personal Data</TabsTrigger>
          <TabsTrigger value="custom-questions">Custom Questions</TabsTrigger>
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
                <div className="md:col-span-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={config.companyName}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal-data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Data Field Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Select 
                    value={personalDataMappings.firstName} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, firstName: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Select 
                    value={personalDataMappings.lastName} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, lastName: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Select 
                    value={personalDataMappings.email} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, email: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Select 
                    value={personalDataMappings.phone} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, phone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City/Municipality</Label>
                  <Select 
                    value={personalDataMappings.municipality} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, municipality: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>State/Region</Label>
                  <Select 
                    value={personalDataMappings.region} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, region: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Select 
                    value={personalDataMappings.postalCode} 
                    onValueChange={(value) => setPersonalDataMappings({...personalDataMappings, postalCode: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        value={question.id}
                        onChange={(e) => {
                          const updated = [...customQuestions];
                          updated[index].id = e.target.value;
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
                      <Select 
                        value={question.mapping} 
                        onValueChange={(value) => {
                          const updated = [...customQuestions];
                          updated[index].mapping = value;
                          setCustomQuestions(updated);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map(field => (
                            <SelectItem key={field} value={field}>{field}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeCustomQuestion(index)}
                    variant="destructive"
                    size="sm"
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
                <MapPin className="w-5 h-5" />
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
                    <Label>Display Prompt</Label>
                    <Input
                      value={field.prompt}
                      onChange={(e) => {
                        const updated = [...displayFields];
                        updated[index].prompt = e.target.value;
                        setDisplayFields(updated);
                      }}
                      placeholder="Display prompt"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Field Mapping</Label>
                    <Select 
                      value={field.mapping} 
                      onValueChange={(value) => {
                        const updated = [...displayFields];
                        updated[index].mapping = value;
                        setDisplayFields(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => removeDisplayField(index)}
                    variant="destructive"
                    size="sm"
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