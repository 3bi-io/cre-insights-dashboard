import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
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
  const [userParam, setUserParam] = useState('*');

  const fetchFeeds = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching feeds for user:', userParam);
      
      const { data, error: functionError } = await supabase.functions.invoke('fetch-feeds', {
        body: { user: userParam }
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
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="userParam">User Parameter</Label>
                <Input
                  id="userParam"
                  value={userParam}
                  onChange={(e) => setUserParam(e.target.value)}
                  placeholder="Enter user parameter (e.g., * for all feeds)"
                  className="mt-1"
                />
              </div>
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
              URL: https://cdljobcast.com/client/recruiting/getfeeds?user={userParam}
            </p>
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