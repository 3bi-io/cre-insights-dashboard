import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  XCircle,
  Zap,
  Phone,
  Mail,
  Database,
  Search,
  MessageSquare,
  Calendar,
  Globe,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

interface TestResult {
  status: TestStatus;
  response?: any;
  error?: string;
  timestamp?: Date;
  duration?: number;
}

const EdgeFunctionsTest = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [tests, setTests] = useState<Record<string, TestResult>>({});
  
  // Test parameters
  const [tenstreetCompanyId, setTenstreetCompanyId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [grokMessage, setGrokMessage] = useState('What is 2+2?');
  const [feedUser, setFeedUser] = useState('*');

  const updateTestStatus = (functionName: string, result: Partial<TestResult>) => {
    setTests(prev => ({
      ...prev,
      [functionName]: { ...prev[functionName], ...result }
    }));
  };

  const testEdgeFunction = async (
    functionName: string,
    payload: any,
    description: string
  ) => {
    const startTime = Date.now();
    updateTestStatus(functionName, { status: 'loading', error: undefined, response: undefined });

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      const duration = Date.now() - startTime;

      if (error) throw error;

      updateTestStatus(functionName, {
        status: 'success',
        response: data,
        timestamp: new Date(),
        duration
      });

      toast.success(`${description} - Success`, {
        description: `Completed in ${duration}ms`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTestStatus(functionName, {
        status: 'error',
        error: error.message || 'Unknown error',
        timestamp: new Date(),
        duration
      });

      toast.error(`${description} - Failed`, {
        description: error.message || 'Unknown error'
      });
    }
  };

  const testTenstreetExplorer = () => {
    if (!tenstreetCompanyId) {
      toast.error('Please enter a Tenstreet Company ID');
      return;
    }
    testEdgeFunction(
      'tenstreet-explorer',
      { company_id: tenstreetCompanyId, action: 'explore_services' },
      'Tenstreet Explorer'
    );
  };

  const testGrokChat = () => {
    testEdgeFunction(
      'grok-chat',
      { message: grokMessage, model: 'grok-2-1212' },
      'Grok Chat'
    );
  };

  const testSmsAuth = () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    testEdgeFunction(
      'sms-auth',
      { action: 'send_magic_link', phoneNumber },
      'SMS Authentication'
    );
  };

  const testFetchFeeds = () => {
    testEdgeFunction(
      'fetch-feeds',
      { user: feedUser },
      'Fetch Feeds'
    );
  };

  const testGoogleIndexing = () => {
    testEdgeFunction(
      'google-indexing',
      { action: 'publish_all' },
      'Google Indexing'
    );
  };

  const testIndeedIntegration = () => {
    testEdgeFunction(
      'indeed-integration',
      { action: 'getIndeedStats', employerId: 'test123' },
      'Indeed Integration'
    );
  };

  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    const variants = {
      idle: 'secondary',
      loading: 'default',
      success: 'default',
      error: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]} className="ml-auto">
        {status === 'idle' && 'Not Tested'}
        {status === 'loading' && 'Testing...'}
        {status === 'success' && 'Success'}
        {status === 'error' && 'Failed'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== 'super_admin') {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need super administrator permissions to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edge Functions Testing</h1>
          <p className="text-muted-foreground">
            Test and monitor all Supabase Edge Function integrations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
        >
          Back to Admin
        </Button>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Services
          </TabsTrigger>
          <TabsTrigger value="communication">
            <Phone className="h-4 w-4 mr-2" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Database className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="feeds">
            <Globe className="h-4 w-4 mr-2" />
            Feeds & APIs
          </TabsTrigger>
          <TabsTrigger value="results">
            <Activity className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* AI Services Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Grok Chat (xAI)
                {getStatusIcon(tests['grok-chat']?.status || 'idle')}
              </CardTitle>
              <CardDescription>
                Test the xAI Grok chat completion endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grok-message">Message</Label>
                <Textarea
                  id="grok-message"
                  value={grokMessage}
                  onChange={(e) => setGrokMessage(e.target.value)}
                  placeholder="Enter a message for Grok..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={testGrokChat} disabled={tests['grok-chat']?.status === 'loading'}>
                  {tests['grok-chat']?.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Test Grok Chat
                </Button>
                {getStatusBadge(tests['grok-chat']?.status || 'idle')}
              </div>
              {tests['grok-chat']?.response && (
                <ScrollArea className="h-32 w-full border rounded-md p-3">
                  <pre className="text-xs">{JSON.stringify(tests['grok-chat'].response, null, 2)}</pre>
                </ScrollArea>
              )}
              {tests['grok-chat']?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tests['grok-chat'].error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                SMS Authentication
                {getStatusIcon(tests['sms-auth']?.status || 'idle')}
              </CardTitle>
              <CardDescription>
                Test SMS magic link sending via Twilio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={testSmsAuth} disabled={tests['sms-auth']?.status === 'loading'}>
                  {tests['sms-auth']?.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  Send Test SMS
                </Button>
                {getStatusBadge(tests['sms-auth']?.status || 'idle')}
              </div>
              {tests['sms-auth']?.response && (
                <ScrollArea className="h-32 w-full border rounded-md p-3">
                  <pre className="text-xs">{JSON.stringify(tests['sms-auth'].response, null, 2)}</pre>
                </ScrollArea>
              )}
              {tests['sms-auth']?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tests['sms-auth'].error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tenstreet Explorer
                {getStatusIcon(tests['tenstreet-explorer']?.status || 'idle')}
              </CardTitle>
              <CardDescription>
                Explore available Tenstreet API services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-id">Company ID</Label>
                <Input
                  id="company-id"
                  value={tenstreetCompanyId}
                  onChange={(e) => setTenstreetCompanyId(e.target.value)}
                  placeholder="Enter Tenstreet Company ID"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={testTenstreetExplorer} disabled={tests['tenstreet-explorer']?.status === 'loading'}>
                  {tests['tenstreet-explorer']?.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Explore Services
                </Button>
                {getStatusBadge(tests['tenstreet-explorer']?.status || 'idle')}
              </div>
              {tests['tenstreet-explorer']?.response && (
                <ScrollArea className="h-48 w-full border rounded-md p-3">
                  <pre className="text-xs">{JSON.stringify(tests['tenstreet-explorer'].response, null, 2)}</pre>
                </ScrollArea>
              )}
              {tests['tenstreet-explorer']?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tests['tenstreet-explorer'].error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Indeed Integration
                {getStatusIcon(tests['indeed-integration']?.status || 'idle')}
              </CardTitle>
              <CardDescription>
                Test Indeed analytics integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={testIndeedIntegration} disabled={tests['indeed-integration']?.status === 'loading'}>
                  {tests['indeed-integration']?.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Test Indeed Stats
                </Button>
                {getStatusBadge(tests['indeed-integration']?.status || 'idle')}
              </div>
              {tests['indeed-integration']?.response && (
                <ScrollArea className="h-32 w-full border rounded-md p-3">
                  <pre className="text-xs">{JSON.stringify(tests['indeed-integration'].response, null, 2)}</pre>
                </ScrollArea>
              )}
              {tests['indeed-integration']?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tests['indeed-integration'].error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feeds & APIs Tab */}
        <TabsContent value="feeds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Fetch Feeds
                {getStatusIcon(tests['fetch-feeds']?.status || 'idle')}
              </CardTitle>
              <CardDescription>
                Fetch job feeds from external API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feed-user">User Filter</Label>
                <Input
                  id="feed-user"
                  value={feedUser}
                  onChange={(e) => setFeedUser(e.target.value)}
                  placeholder="* for all users"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={testFetchFeeds} disabled={tests['fetch-feeds']?.status === 'loading'}>
                  {tests['fetch-feeds']?.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Fetch Feeds
                </Button>
                {getStatusBadge(tests['fetch-feeds']?.status || 'idle')}
              </div>
              {tests['fetch-feeds']?.response && (
                <ScrollArea className="h-48 w-full border rounded-md p-3">
                  <pre className="text-xs">{JSON.stringify(tests['fetch-feeds'].response, null, 2)}</pre>
                </ScrollArea>
              )}
              {tests['fetch-feeds']?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tests['fetch-feeds'].error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Google Indexing
                {getStatusIcon(tests['google-indexing']?.status || 'idle')}
              </CardTitle>
              <CardDescription>
                Test Google Indexing API integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={testGoogleIndexing} disabled={tests['google-indexing']?.status === 'loading'}>
                  {tests['google-indexing']?.status === 'loading' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Test Indexing
                </Button>
                {getStatusBadge(tests['google-indexing']?.status || 'idle')}
              </div>
              {tests['google-indexing']?.response && (
                <ScrollArea className="h-32 w-full border rounded-md p-3">
                  <pre className="text-xs">{JSON.stringify(tests['google-indexing'].response, null, 2)}</pre>
                </ScrollArea>
              )}
              {tests['google-indexing']?.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{tests['google-indexing'].error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Summary Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results Summary</CardTitle>
              <CardDescription>
                Overview of all edge function tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(tests).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tests run yet</p>
                ) : (
                  Object.entries(tests).map(([name, result]) => (
                    <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{name}</p>
                          {result.timestamp && (
                            <p className="text-xs text-muted-foreground">
                              {result.timestamp.toLocaleTimeString()} • {result.duration}ms
                            </p>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EdgeFunctionsTest;
