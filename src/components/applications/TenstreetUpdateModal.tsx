import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Upload, Save, Settings, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TenstreetUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
}

const TenstreetUpdateModal = ({ isOpen, onClose, application }: TenstreetUpdateModalProps) => {
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [firstName, setFirstName] = useState(application?.first_name || '');
  const [lastName, setLastName] = useState(application?.last_name || '');
  const [email, setEmail] = useState(application?.applicant_email || '');
  const [phone, setPhone] = useState(application?.phone || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showMappingSettings, setShowMappingSettings] = useState(false);
  const [mappingName, setMappingName] = useState('Default Mapping');
  const [fieldMappings, setFieldMappings] = useState<any>({});
  const [savedMappings, setSavedMappings] = useState<any[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<string>('');
  const { toast } = useToast();
  const { credentials, fieldMappings: defaultMappings, isLoading: configLoading } = useTenstreetConfiguration();

  // Available Tenstreet fields for mapping
  const tenstreetFields = [
    'FirstName', 'LastName', 'Email', 'Phone', 'DateOfBirth', 'SSN',
    'Address1', 'Address2', 'City', 'State', 'ZipCode', 'CDL', 'Experience',
    'Veteran', 'DriverID', 'CDLExpiration', 'MedicalCardExpiration',
    // Age-related fields
    'Over21', 'Age'
  ];

  // Load saved mappings on component mount
  useEffect(() => {
    if (isOpen) {
      loadSavedMappings();
    }
  }, [isOpen]);

  const loadSavedMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('tenstreet_field_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedMappings(data || []);
      
      // Load default mapping if available
      const defaultMapping = data?.find(m => m.is_default);
      if (defaultMapping) {
        setFieldMappings(defaultMapping.field_mappings);
        setMappingName(defaultMapping.mapping_name);
        setSelectedMapping(defaultMapping.id);
      }
    } catch (error) {
      logger.error('Error loading mappings', error, { context: 'TenstreetUpdateModal' });
    }
  };

  const saveMappingSettings = async () => {
    try {
      const mappingData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        mapping_name: mappingName,
        field_mappings: fieldMappings,
        is_default: true
      };

      // Update existing mapping or create new one
      if (selectedMapping) {
        const { error } = await supabase
          .from('tenstreet_field_mappings')
          .update(mappingData)
          .eq('id', selectedMapping);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenstreet_field_mappings')
          .insert(mappingData);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Field mapping settings saved successfully",
      });

      loadSavedMappings();
    } catch (error) {
      logger.error('Error saving mapping', error, { context: 'TenstreetUpdateModal' });
      toast({
        title: "Error",
        description: "Failed to save field mapping settings",
        variant: "destructive",
      });
    }
  };

  const loadMappingById = (mappingId: string) => {
    const mapping = savedMappings.find(m => m.id === mappingId);
    if (mapping) {
      setFieldMappings(mapping.field_mappings);
      setMappingName(mapping.mapping_name);
      setSelectedMapping(mappingId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials) {
      toast({
        title: "Configuration Required",
        description: "Please configure Tenstreet credentials in settings first",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const applicationData = {
        id: application.id,
        first_name: firstName,
        last_name: lastName,
        applicant_email: email,
        phone: phone,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : application?.date_of_birth,
        ...application
      };

      const config = {
        clientId: credentials.client_id,
        password: credentials.password, // Changed from password_encrypted
        service: credentials.service,
        mode: credentials.mode,
        source: credentials.source,
        companyId: credentials.company_ids?.[0] || '',
        companyName: credentials.company_name,
        appReferrer: credentials.app_referrer || '3BI'
      };

      const mappings = fieldMappings || defaultMappings?.field_mappings || {
        personalData: {},
        customQuestions: [],
        displayFields: []
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to send updates to Tenstreet.",
          variant: "destructive",
        });
        throw new Error('Unauthorized');
      }

      const { data, error } = await supabase.functions.invoke('tenstreet-integration', {
        body: {
          action: 'send_application',
          applicationData,
          config,
          mappings
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Update the applications table with the new data
      const updatedData = {
        first_name: firstName,
        last_name: lastName,
        applicant_email: email,
        phone: phone,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : application?.date_of_birth,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('applications')
        .update(updatedData)
        .eq('id', application.id);

      if (updateError) {
        logger.warn('Posted to Tenstreet but failed to update local application', { error: updateError, context: 'TenstreetUpdateModal' });
        toast({
          title: "Warning",
          description: "Posted to Tenstreet but failed to update local application data",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Application successfully posted to Tenstreet and updated locally",
        });
      }
      
      onClose();
    } catch (error) {
      logger.error('Error posting to Tenstreet', error, { context: 'TenstreetUpdateModal' });
      toast({
        title: "Error",
        description: "Failed to post application to Tenstreet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in" aria-describedby="tenstreet-update-description">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">Post to Tenstreet ATS</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Configure and send applicant data</p>
            </div>
          </div>
          <div id="tenstreet-update-description" className="sr-only">
            Configure and send applicant data to Tenstreet. Map application fields to Tenstreet format and review before sending.
          </div>
        </DialogHeader>

        {!credentials && !configLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tenstreet credentials not configured. Please configure in Settings → Integrations → Tenstreet first.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={setDateOfBirth}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Field Mapping Settings</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMappingSettings(!showMappingSettings)}
              >
                <Settings className="w-4 h-4 mr-2" />
                {showMappingSettings ? 'Hide' : 'Configure'}
              </Button>
            </div>

            {showMappingSettings && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mappingName">Mapping Name</Label>
                    <Input
                      id="mappingName"
                      value={mappingName}
                      onChange={(e) => setMappingName(e.target.value)}
                      placeholder="Enter mapping name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="savedMappings">Load Saved Mapping</Label>
                    <Select value={selectedMapping} onValueChange={loadMappingById}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a saved mapping" />
                      </SelectTrigger>
                      <SelectContent>
                        {savedMappings.map((mapping) => (
                          <SelectItem key={mapping.id} value={mapping.id}>
                            {mapping.mapping_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Field Mappings</Label>
                  <div className="grid gap-3 max-h-48 overflow-y-auto">
                    {tenstreetFields.map((field) => (
                      <div key={field} className="grid grid-cols-2 gap-2 items-center">
                        <Label className="text-sm">{field}</Label>
                        <Select
                          value={fieldMappings[field] || '__UNMAPPED__'}
                          onValueChange={(value) => 
                            setFieldMappings(prev => ({ 
                              ...prev, 
                              [field]: value === '__UNMAPPED__' ? '' : value 
                            }))
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__UNMAPPED__">Not mapped</SelectItem>
                            {Object.keys(application || {}).map((appField) => (
                              <SelectItem key={appField} value={appField}>
                                {appField.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveMappingSettings}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Mapping
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !credentials || configLoading}>
              {isLoading ? "Posting..." : "Post to Tenstreet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TenstreetUpdateModal;