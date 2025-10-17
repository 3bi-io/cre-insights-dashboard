import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Database, RefreshCw, Users, FileText, X, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TenstreetExplorer = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedService, setSelectedService] = useState('');
  const [searchParams, setSearchParams] = useState({
    driverId: '',
    email: '',
    phone: '',
    lastName: ''
  });
  const { toast } = useToast();

  const exploreServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: { action: 'explore_services' }
      });

      if (error) throw error;

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
    setIsLoading(true);
    setSelectedService(serviceName);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'test_service',
          service: serviceName
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
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'search_applicants',
          criteria: searchParams
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

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('tenstreet-explorer', {
        body: {
          action: 'get_applicant_data',
          driverId: searchParams.driverId
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

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
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