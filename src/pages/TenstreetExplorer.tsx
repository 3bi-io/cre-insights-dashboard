import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Database, RefreshCw, Users, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenstreet API Explorer</h1>
        <p className="text-muted-foreground mt-1">Discover and test available Tenstreet endpoints</p>
      </div>

      <Tabs defaultValue="services" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="retrieve">Retrieve</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Services</CardTitle>
              <CardDescription>Explore Tenstreet API capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={exploreServices} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                Discover Services
              </Button>

              {services && (
                <div className="space-y-2 mt-4">
                  <h3 className="font-semibold">Endpoint: {services.endpoint}</h3>
                  <p className="text-sm text-muted-foreground">{services.note}</p>
                  
                  <div className="grid gap-3 mt-4">
                    {services.services?.map((service: any) => (
                      <Card key={service.name} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">Method: {service.method}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testService(service.name)}
                            disabled={isLoading}
                          >
                            {isLoading && selectedService === service.name ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Test'
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Applicants
              </CardTitle>
              <CardDescription>Search for existing applicants by various criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={searchParams.email}
                    onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
                    placeholder="applicant@example.com"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={searchParams.phone}
                    onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
                    placeholder="555-123-4567"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={searchParams.lastName}
                    onChange={(e) => setSearchParams({ ...searchParams, lastName: e.target.value })}
                    placeholder="Smith"
                  />
                </div>
              </div>

              <Button onClick={searchApplicants} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search Applicants
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retrieve" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Retrieve Applicant Data
              </CardTitle>
              <CardDescription>Get detailed information for a specific driver</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Driver ID</Label>
                <Input
                  value={searchParams.driverId}
                  onChange={(e) => setSearchParams({ ...searchParams, driverId: e.target.value })}
                  placeholder="Enter driver ID"
                />
              </div>

              <Button onClick={getApplicantData} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Retrieve Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                API Response
              </CardTitle>
              <CardDescription>Raw response from Tenstreet API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testResult ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <span className={testResult.success ? "text-green-600" : "text-red-600"}>
                      {testResult.success ? "Success" : "Failed"}
                    </span>
                    <span className="text-muted-foreground">({testResult.status})</span>
                  </div>

                  {testResult.action && (
                    <div>
                      <span className="font-semibold">Action: </span>
                      <span>{testResult.action}</span>
                    </div>
                  )}

                  {testResult.parsed && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Parsed Response:</h4>
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                        {JSON.stringify(testResult.parsed, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold">Raw XML Response:</h4>
                    <Textarea
                      value={testResult.response}
                      readOnly
                      className="font-mono text-xs h-64"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Request XML:</h4>
                    <Textarea
                      value={testResult.request}
                      readOnly
                      className="font-mono text-xs h-64"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No results yet. Run a test or search to see responses.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenstreetExplorer;