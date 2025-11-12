import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Database, RefreshCw, Users, FileText, X, AlertCircle, CheckCircle2, Sparkles, Shield, Download, Briefcase, Edit, UserPlus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useATSExplorerAccess } from '@/hooks/useATSExplorerAccess';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TenstreetExplorer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedService, setSelectedService] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [searchParams, setSearchParams] = useState({
    driverId: '',
    email: '',
    phone: '',
    lastName: ''
  });
  const [updateParams, setUpdateParams] = useState({
    driverId: '',
    status: ''
  });
  const [exportParams, setExportParams] = useState({
    startDate: '',
    endDate: ''
  });
  const [createParams, setCreateParams] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const { toast } = useToast();
  const { hasATSExplorerAccess, isLoading: isCheckingAccess } = useATSExplorerAccess();
  const { userRole, organization } = useAuth();

  const isSuperAdmin = userRole === 'super_admin';

  // Fetch available companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        console.log('Fetching companies for ATS Explorer...');
        const query = supabase
          .from('tenstreet_credentials')
          .select('company_ids, company_name, organization_id')
          .eq('status', 'active');

        // Super admins see all companies, others see only their org
        if (!isSuperAdmin && organization?.id) {
          query.eq('organization_id', organization.id);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching credentials:', error);
          throw error;
        }

        console.log('Credentials data:', data);

        if (data && data.length > 0) {
          const companies = data.flatMap(cred => 
            (cred.company_ids || []).map((id: string) => ({
              id,
              name: `${cred.company_name} (${id})`
            }))
          );
          console.log('Available companies:', companies);
          setAvailableCompanies(companies);
          if (companies.length > 0) {
            setSelectedCompanyId(companies[0].id);
            console.log('Selected company ID:', companies[0].id);
          }
        } else {
          console.log('No credentials found');
          toast({
            title: 'No Companies Found',
            description: 'No Tenstreet credentials configured. Please contact your administrator.',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        console.error('Error fetching companies:', error);
        toast({
          title: 'Error',
          description: 'Failed to load companies: ' + error.message,
          variant: 'destructive',
        });
      }
    };

    if (hasATSExplorerAccess) {
      fetchCompanies();
    }
  }, [hasATSExplorerAccess, isSuperAdmin, organization?.id, toast]);

  // Access control check
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasATSExplorerAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
        <Card className="max-w-md border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="h-6 w-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You don't have permission to access the ATS Explorer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-muted">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ATS Explorer access must be enabled for your organization by a super administrator.
                Please contact your system administrator to request access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const exploreServices = async () => {
    console.log('exploreServices called with company_id:', selectedCompanyId);
    
    if (!selectedCompanyId) {
      console.error('No company ID selected');
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('[TenstreetExplorer] Starting explore services request');
      console.log('[TenstreetExplorer] Selected company ID:', selectedCompanyId);
      
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: { 
          action: 'explore_services',
          company_id: selectedCompanyId
        }
      });

      console.log('[TenstreetExplorer] Edge function response:', { data, error });
      
      if (error) {
        console.error('[TenstreetExplorer] Edge function error:', error);
        throw new Error(error.message || 'Unknown edge function error');
      }

      setServices(data);
      toast({
        title: "Services Discovered",
        description: `Found ${data.services?.length || 0} available Tenstreet services`
      });
    } catch (error: any) {
      toast({
        title: "Exploration Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testService = async (serviceName: string) => {
    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSelectedService(serviceName);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'test_service',
          service: serviceName,
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: data.success ? "Test Successful" : "Test Failed",
        description: `Service: ${serviceName}`,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchApplicants = async () => {
    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'search_applicants',
          criteria: searchParams,
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: "Search Complete",
        description: "Applicant search results retrieved"
      });
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getApplicantData = async () => {
    if (!searchParams.driverId) {
      toast({
        title: "Missing Driver ID",
        description: "Please enter a driver ID",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'get_applicant_data',
          driverId: searchParams.driverId,
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: "Applicant Data Retrieved",
        description: `Driver ID: ${searchParams.driverId}`
      });
    } catch (error: any) {
      toast({
        title: "Retrieval Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateApplicantStatus = async () => {
    if (!updateParams.driverId || !updateParams.status) {
      toast({
        title: "Missing Fields",
        description: "Please enter both Driver ID and Status",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'update_applicant_status',
          driverId: updateParams.driverId,
          status: updateParams.status,
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: "Status Updated",
        description: `Driver ${updateParams.driverId} status set to ${updateParams.status}`
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportApplicants = async () => {
    if (!exportParams.startDate || !exportParams.endDate) {
      toast({
        title: "Missing Dates",
        description: "Please select both start and end dates",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'export_applicants',
          dateRange: exportParams,
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: "Export Complete",
        description: `Exported applicants from ${exportParams.startDate} to ${exportParams.endDate}`
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableJobs = async () => {
    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'get_available_jobs',
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: "Jobs Retrieved",
        description: "Available job listings loaded"
      });
    } catch (error: any) {
      toast({
        title: "Failed to Load Jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApplicant = async () => {
    if (!createParams.firstName || !createParams.lastName || !createParams.email || !createParams.phone) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCompanyId) {
      toast({
        title: 'Error',
        description: 'Please select a company',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'subject_upload',
          applicantData: createParams,
          company_id: selectedCompanyId
        }
      });

      if (error) throw error;

      setTestResult(data);
      toast({
        title: "Applicant Created",
        description: `${createParams.firstName} ${createParams.lastName} has been uploaded to Tenstreet`
      });
      // Clear form
      setCreateParams({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">ATS Explorer</h1>
                <p className="text-muted-foreground">Discover and test Tenstreet API capabilities</p>
              </div>
            </div>
          </div>
          {testResult && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setTestResult(null)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear Results
            </Button>
          )}
        </div>

        {/* Company Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Tenstreet Company</CardTitle>
            <CardDescription>
              Select the Tenstreet company ID to query
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="company-select">Company ID:</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger id="company-select" className="w-[300px]">
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSuperAdmin && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Super Admin
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-8 h-auto p-1 bg-muted/50">
            <TabsTrigger value="services" className="gap-2 data-[state=active]:bg-background">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Services</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2 data-[state=active]:bg-background">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="retrieve" className="gap-2 data-[state=active]:bg-background">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Retrieve</span>
            </TabsTrigger>
            <TabsTrigger value="update" className="gap-2 data-[state=active]:bg-background">
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Update</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2 data-[state=active]:bg-background">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2 data-[state=active]:bg-background">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Jobs</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2 data-[state=active]:bg-background">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2 data-[state=active]:bg-background">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
              {testResult && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  1
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Available Services</CardTitle>
                    <CardDescription>Explore and test Tenstreet API endpoints</CardDescription>
                  </div>
                  {services && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {services.services?.length || 0} Services
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={exploreServices} 
                  disabled={isLoading}
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  Discover Services
                </Button>

                {services && (
                  <div className="space-y-4 mt-6">
                    <Alert className="border-primary/30 bg-primary/5">
                      <Database className="h-4 w-4" />
                      <AlertDescription>
                        <span className="font-semibold">Endpoint:</span> {services.endpoint}
                        <br />
                        <span className="text-sm text-muted-foreground">{services.note}</span>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid gap-3">
                      {services.services?.map((service: any) => (
                        <Card 
                          key={service.name} 
                          className="p-4 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start gap-2">
                                <h4 className="font-semibold text-base">{service.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {service.method}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {service.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => testService(service.name)}
                              disabled={isLoading}
                              className="shrink-0 gap-2"
                            >
                              {isLoading && selectedService === service.name ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Testing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" />
                                  Test
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {!services && !isLoading && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No services discovered yet</p>
                    <p className="text-sm">Click "Discover Services" to explore available endpoints</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-5 w-5 text-primary" />
                  Search Applicants
                </CardTitle>
                <CardDescription>Find applicants using email, phone, or name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      value={searchParams.email}
                      onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
                      placeholder="applicant@example.com"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      value={searchParams.phone}
                      onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
                      placeholder="555-123-4567"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="lastName"
                      value={searchParams.lastName}
                      onChange={(e) => setSearchParams({ ...searchParams, lastName: e.target.value })}
                      placeholder="Smith"
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    onClick={searchApplicants} 
                    disabled={isLoading}
                    size="lg"
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search Applicants
                  </Button>
                  
                  {(searchParams.email || searchParams.phone || searchParams.lastName) && (
                    <Button 
                      variant="outline"
                      onClick={() => setSearchParams({ driverId: '', email: '', phone: '', lastName: '' })}
                      size="lg"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>

                <Alert className="border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Enter at least one search criterion to find matching applicants in the system
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retrieve" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="h-5 w-5 text-primary" />
                  Retrieve Applicant Data
                </CardTitle>
                <CardDescription>Get complete information for a specific driver by ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="driverId" className="text-sm font-medium">Driver ID</Label>
                  <Input
                    id="driverId"
                    value={searchParams.driverId}
                    onChange={(e) => setSearchParams({ ...searchParams, driverId: e.target.value })}
                    placeholder="Enter driver ID"
                    className="h-10"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={getApplicantData} 
                    disabled={isLoading || !searchParams.driverId}
                    size="lg"
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Retrieve Data
                  </Button>

                  {searchParams.driverId && (
                    <Button 
                      variant="outline"
                      onClick={() => setSearchParams({ ...searchParams, driverId: '' })}
                      size="lg"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>

                <Alert className="border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This will fetch complete driver profile including personal information, work history, and qualifications
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="update" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Edit className="h-5 w-5 text-primary" />
                  Update Applicant Status
                </CardTitle>
                <CardDescription>Change the status of an existing applicant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-driverId" className="text-sm font-medium">Driver ID</Label>
                    <Input
                      id="update-driverId"
                      value={updateParams.driverId}
                      onChange={(e) => setUpdateParams({ ...updateParams, driverId: e.target.value })}
                      placeholder="Enter driver ID"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
                    <Select value={updateParams.status} onValueChange={(value) => setUpdateParams({ ...updateParams, status: value })}>
                      <SelectTrigger id="status" className="h-10">
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Interview Scheduled">Interview Scheduled</SelectItem>
                        <SelectItem value="Hired">Hired</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={updateApplicantStatus} 
                    disabled={isLoading || !updateParams.driverId || !updateParams.status}
                    size="lg"
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Update Status
                  </Button>

                  {(updateParams.driverId || updateParams.status) && (
                    <Button 
                      variant="outline"
                      onClick={() => setUpdateParams({ driverId: '', status: '' })}
                      size="lg"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>

                <Alert className="border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This will update the applicant's status in the Tenstreet system
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Download className="h-5 w-5 text-primary" />
                  Export Applicants
                </CardTitle>
                <CardDescription>Export applicant data for a date range</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={exportParams.startDate}
                      onChange={(e) => setExportParams({ ...exportParams, startDate: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={exportParams.endDate}
                      onChange={(e) => setExportParams({ ...exportParams, endDate: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={exportApplicants} 
                    disabled={isLoading || !exportParams.startDate || !exportParams.endDate}
                    size="lg"
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Export Data
                  </Button>

                  {(exportParams.startDate || exportParams.endDate) && (
                    <Button 
                      variant="outline"
                      onClick={() => setExportParams({ startDate: '', endDate: '' })}
                      size="lg"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>

                <Alert className="border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Export applicant records that were created or modified within the selected date range
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Available Jobs
                </CardTitle>
                <CardDescription>View job listings from Tenstreet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={getAvailableJobs} 
                  disabled={isLoading}
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Briefcase className="h-4 w-4" />
                  )}
                  Get Available Jobs
                </Button>

                <Alert className="border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This will retrieve all active job listings configured in your Tenstreet account
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Create Applicant
                </CardTitle>
                <CardDescription>Upload a new applicant to Tenstreet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
                    <Input
                      id="firstName"
                      value={createParams.firstName}
                      onChange={(e) => setCreateParams({ ...createParams, firstName: e.target.value })}
                      placeholder="John"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={createParams.lastName}
                      onChange={(e) => setCreateParams({ ...createParams, lastName: e.target.value })}
                      placeholder="Doe"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={createParams.email}
                      onChange={(e) => setCreateParams({ ...createParams, email: e.target.value })}
                      placeholder="john.doe@example.com"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-phone" className="text-sm font-medium">Phone (10 digits) *</Label>
                    <Input
                      id="create-phone"
                      value={createParams.phone}
                      onChange={(e) => setCreateParams({ ...createParams, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      placeholder="5551234567"
                      className="h-10"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={createApplicant} 
                    disabled={isLoading || !createParams.firstName || !createParams.lastName || !createParams.email || !createParams.phone}
                    size="lg"
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Create Applicant
                  </Button>

                  {(createParams.firstName || createParams.lastName || createParams.email || createParams.phone) && (
                    <Button 
                      variant="outline"
                      onClick={() => setCreateParams({ firstName: '', lastName: '', email: '', phone: '' })}
                      size="lg"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>

                <Alert className="border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    This will create a new applicant record in Tenstreet. All fields marked with * are required.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4 mt-6">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5 text-primary" />
                      API Response
                    </CardTitle>
                    <CardDescription>Detailed response from Tenstreet API</CardDescription>
                  </div>
                  {testResult && (
                    <Badge 
                      variant={testResult.success ? "default" : "destructive"}
                      className="gap-1"
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {testResult.success ? "Success" : "Failed"}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {testResult ? (
                  <div className="space-y-6">
                    <Alert className={testResult.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}>
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <AlertDescription>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">Status:</span>
                          <Badge variant="outline">{testResult.status}</Badge>
                          {testResult.action && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="font-semibold">Action:</span>
                              <span>{testResult.action}</span>
                            </>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>

                    {testResult.parsed && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">Parsed Response</h4>
                          <Badge variant="secondary">JSON</Badge>
                        </div>
                        <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-xs border border-border">
                          {JSON.stringify(testResult.parsed, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">Raw XML Response</h4>
                        <Badge variant="secondary">XML</Badge>
                      </div>
                      <Textarea
                        value={testResult.response}
                        readOnly
                        className="font-mono text-xs h-64 resize-none bg-muted/50"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-base">Request XML</h4>
                        <Badge variant="secondary">XML</Badge>
                      </div>
                      <Textarea
                        value={testResult.request}
                        readOnly
                        className="font-mono text-xs h-64 resize-none bg-muted/50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-lg mb-1">No results yet</p>
                    <p className="text-sm">Run a test, search, or retrieve action to see API responses</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenstreetExplorer;