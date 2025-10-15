import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Feed {
  id?: string;
  name?: string;
  url?: string;
  status?: string;
  type?: string;
  description?: string;
  last_updated?: string;
  [key: string]: any;
}

const SuperAdminFeeds = () => {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userParam, setUserParam] = useState('danny_herman_trucking');
  const [boardParam, setBoardParam] = useState('AIRecruiter');
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [appCount, setAppCount] = useState(50);

  // Available user options for the dropdown
  const availableUsers = [
    { value: 'danny_herman_trucking', label: 'Danny Herman Trucking' },
    { value: 'prime_inc', label: 'Prime Inc' },
    { value: 'schneider', label: 'Schneider' },
    { value: 'swift_transportation', label: 'Swift Transportation' },
    { value: 'jb_hunt', label: 'J.B. Hunt' },
    { value: 'werner', label: 'Werner Enterprises' },
    { value: 'crete_carrier', label: 'Crete Carrier' },
    { value: 'maverick', label: 'Maverick Transportation' },
    { value: 'covenant', label: 'Covenant Transport' },
    { value: 'roehl', label: 'Roehl Transport' }
  ];

  const fetchFeeds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching feeds for user:', userParam);
      
      const { data, error: functionError } = await supabase.functions.invoke('fetch-feeds', {
        body: { user: userParam, board: boardParam }
      });
      
      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch feeds');
      }
      
      const apiData = data.data;
      let processedFeeds: Feed[] = [];
      
      // Handle different possible response structures
      if (Array.isArray(apiData)) {
        processedFeeds = apiData;
      } else if (apiData.feeds && Array.isArray(apiData.feeds)) {
        processedFeeds = apiData.feeds;
      } else if (apiData.data && Array.isArray(apiData.data)) {
        processedFeeds = apiData.data;
      } else if (typeof apiData === 'object' && apiData !== null) {
        // If it's an object, convert to array
        processedFeeds = [apiData];
      }
      
      setFeeds(processedFeeds);
      
      toast({
        title: "Feeds loaded successfully",
        description: `Found ${processedFeeds.length} feeds for user: ${userParam}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch feeds';
      setError(errorMessage);
      console.error('Error fetching feeds:', err);
      toast({
        title: "Error loading feeds",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const importJobsFromFeed = async (feedUrl: string) => {
    setImporting(true);
    try {
      console.log('Importing jobs from feed:', feedUrl);
      
      const { data, error: functionError } = await supabase.functions.invoke('import-jobs-from-feed', {
        body: { 
          feedUrl: feedUrl,
          organizationId: '84214b48-7b51-45bc-ad7f-723bcf50466c' // Hayes Recruiting Solutions
        }
      });
      
      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to import jobs');
      }
      
      toast({
        title: "Jobs imported successfully",
        description: data.message,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import jobs';
      console.error('Error importing jobs:', err);
      toast({
        title: "Error importing jobs",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const generateApplications = async () => {
    setGenerating(true);
    try {
      console.log('Generating applications for Hayes...');
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-hayes-applications', {
        body: { 
          count: appCount,
          organization_id: '84214b48-7b51-45bc-ad7f-723bcf50466c'
        }
      });
      
      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate applications');
      }
      
      toast({
        title: "Applications Generated",
        description: data.message,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate applications';
      console.error('Error generating applications:', err);
      toast({
        title: "Error generating applications",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchFeeds();
    }
  }, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restrict access to super admins only
  if (userRole !== 'super_admin') {
    return (
      <PageLayout title="Access Denied" description="Super admin privileges required">
        <div className="container mx-auto px-4 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need super administrator permissions to access this page.
            </AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Super Admin Feeds" 
      description="Manage and monitor all available feeds from CDL Job Cast"
      actions={
        <Button onClick={fetchFeeds} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Feeds
        </Button>
      }
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* User Parameter Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feed Configuration</CardTitle>
            <CardDescription>
              Configure the user parameter to fetch specific feeds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="userParam">User Parameter</Label>
                <Select value={userParam} onValueChange={setUserParam}>
                  <SelectTrigger className="mt-1 bg-background">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md z-50">
                    {availableUsers.map((user) => (
                      <SelectItem key={user.value} value={user.value} className="hover:bg-muted">
                        {user.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="boardParam">Board Parameter</Label>
                <Input
                  id="boardParam"
                  value={boardParam}
                  onChange={(e) => setBoardParam(e.target.value)}
                  placeholder="Enter board parameter"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchFeeds} disabled={loading || !userParam.trim()}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Fetch Feeds
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              URL: https://cdljobcast.com/client/recruiting/getfeeds?user={userParam}{boardParam ? `&board=${boardParam}` : ''}
            </p>
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Current target: Hayes Recruiting Solutions feed (danny_herman_trucking + AIRecruiter)
              </AlertDescription>
            </Alert>
            
            {/* Generate Applications Section */}
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-3">Generate Sample Applications</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create realistic CDL applicant data for Hayes organization (from Adzuna, Indeed, etc.)
              </p>
              <div className="flex gap-4 items-end">
                <div className="flex-1 max-w-xs">
                  <Label htmlFor="appCount">Number of Applications</Label>
                  <Input
                    id="appCount"
                    type="number"
                    min="1"
                    max="500"
                    value={appCount}
                    onChange={(e) => setAppCount(parseInt(e.target.value) || 50)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={generateApplications}
                  disabled={generating || !appCount}
                  variant="default"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    `Generate ${appCount} Applications`
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading feeds...</span>
          </div>
        )}

        {!loading && feeds.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No feeds found</p>
              <Button onClick={fetchFeeds} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && feeds.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Available Feeds ({feeds.length})
              </h2>
              <Badge variant="outline" className="text-sm">
                Source: cdljobcast.com
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {feeds.map((feed, index) => (
                <Card key={feed.id || index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        {feed.name || feed.title || `Feed ${index + 1}`}
                      </CardTitle>
                      {feed.status && (
                        <Badge 
                          variant={feed.status === 'active' || feed.status === 'online' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {feed.status === 'active' || feed.status === 'online' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 mr-1" />
                          )}
                          {feed.status}
                        </Badge>
                      )}
                    </div>
                    {feed.description && (
                      <CardDescription className="text-sm">
                        {feed.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {feed.type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{feed.type}</Badge>
                      </div>
                    )}
                    
                    {feed.url && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">URL:</span>
                        <a 
                          href={feed.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </a>
                      </div>
                    )}
                    
                    {feed.last_updated && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Updated:</span>
                        <span>{new Date(feed.last_updated).toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Display any additional fields */}
                     {Object.entries(feed).map(([key, value]) => {
                       if (['id', 'name', 'title', 'url', 'status', 'type', 'description', 'last_updated'].includes(key)) {
                         return null;
                       }
                       if (typeof value === 'string' || typeof value === 'number') {
                         return (
                           <div key={key} className="flex justify-between text-sm">
                             <span className="text-muted-foreground capitalize">
                               {key.replace(/_/g, ' ')}:
                             </span>
                             <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                               {String(value)}
                             </span>
                           </div>
                         );
                       }
                       return null;
                     })}
                     
                     {/* Import Jobs Button */}
                     <div className="pt-3 border-t">
                       <Button 
                         onClick={() => {
                           const feedUrl = `https://cdljobcast.com/client/recruiting/getfeeds?user=${userParam}${boardParam ? `&board=${boardParam}` : ''}`;
                           importJobsFromFeed(feedUrl);
                         }}
                         disabled={importing}
                         className="w-full"
                         variant="outline"
                       >
                         {importing ? (
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         ) : (
                           <Download className="h-4 w-4 mr-2" />
                         )}
                         Import Jobs to Hayes Recruiting
                       </Button>
                     </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default SuperAdminFeeds;