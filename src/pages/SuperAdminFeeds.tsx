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

  // Available user options for the dropdown (CDL Job Cast partners)
  const availableUsers = [
    // Hayes & Major National Carriers
    { value: 'danny_herman_trucking', label: 'Danny Herman Trucking (Hayes)' },
    { value: 'prime_inc', label: 'Prime Inc' },
    { value: 'schneider', label: 'Schneider' },
    { value: 'swift_transportation', label: 'Swift Transportation' },
    { value: 'jb_hunt', label: 'J.B. Hunt' },
    { value: 'werner', label: 'Werner Enterprises' },
    { value: 'crete_carrier', label: 'Crete Carrier' },
    { value: 'maverick', label: 'Maverick Transportation' },
    { value: 'covenant', label: 'Covenant Transport' },
    { value: 'roehl', label: 'Roehl Transport' },
    { value: 'england_logistics', label: 'C.R. England' },
    { value: 'knight_transportation', label: 'Knight Transportation' },
    { value: 'landstar', label: 'Landstar System' },
    { value: 'heartland_express', label: 'Heartland Express' },
    
    // LTL & Regional Carriers
    { value: 'old_dominion', label: 'Old Dominion Freight Line' },
    { value: 'estes_express', label: 'Estes Express Lines' },
    { value: 'saia_motor', label: 'Saia Motor Freight' },
    { value: 'xpo_logistics', label: 'XPO Logistics' },
    { value: 'fedex_freight', label: 'FedEx Freight' },
    { value: 'ups_freight', label: 'UPS Freight' },
    { value: 'abf_freight', label: 'ABF Freight' },
    { value: 'yrc_freight', label: 'YRC Freight' },
    { value: 'central_transport', label: 'Central Transport' },
    { value: 'roadrunner', label: 'Roadrunner Transportation' },
    { value: 'oak_harbor', label: 'Oak Harbor Freight Lines' },
    { value: 'rl_carriers', label: 'R+L Carriers' },
    { value: 'dayton_freight', label: 'Dayton Freight Lines' },
    { value: 'averitt_express', label: 'Averitt Express' },
    { value: 'southeastern_freight', label: 'Southeastern Freight Lines' },
    { value: 'ward_trucking', label: 'Ward Trucking' },
    { value: 'a_duie_pyle', label: 'A. Duie Pyle' },
    { value: 'new_penn', label: 'New Penn Motor Express' },
    { value: 'pitt_ohio', label: 'Pitt Ohio' },
    { value: 'holland', label: 'Holland (YRC)' },
    
    // Mid-Size & Regional TL Carriers
    { value: 'usa_truck', label: 'USA Truck' },
    { value: 'pam_transport', label: 'PAM Transport' },
    { value: 'celadon', label: 'Celadon Group' },
    { value: 'stevens_transport', label: 'Stevens Transport' },
    { value: 'tmc_transportation', label: 'TMC Transportation' },
    { value: 'marten_transport', label: 'Marten Transport' },
    { value: 'western_express', label: 'Western Express' },
    { value: 'system_transport', label: 'System Transport' },
    { value: 'interstate_distributor', label: 'Interstate Distributor Co' },
    { value: 'epes_transport', label: 'EPES Transport' },
    { value: 'ptl', label: 'Paschall Truck Lines (PTL)' },
    { value: 'melton_truck_lines', label: 'Melton Truck Lines' },
    { value: 'boyd_bros', label: 'Boyd Bros Transportation' },
    { value: 'millis_transfer', label: 'Millis Transfer' },
    { value: 'interstate_companies', label: 'Interstate Companies' },
    { value: 'dart_transit', label: 'Dart Transit Company' },
    { value: 'trans_am', label: 'Trans Am Trucking' },
    { value: 'super_service', label: 'Super Service LLC' },
    { value: 'western_flyer', label: 'Western Flyer Xpress' },
    { value: 'pgt_trucking', label: 'PGT Trucking' },
    { value: 'cfi', label: 'CFI (Contract Freighters Inc)' },
    { value: 'comcar', label: 'COMCAR Industries' },
    { value: 'wilson_logistics', label: 'Wilson Logistics' },
    { value: 'may_trucking', label: 'May Trucking Company' },
    
    // Tanker & Specialized
    { value: 'trimac', label: 'Trimac Transportation' },
    { value: 'quality_carriers', label: 'Quality Carriers' },
    { value: 'kenan_advantage', label: 'Kenan Advantage Group' },
    { value: 'groendyke', label: 'Groendyke Transport' },
    { value: 'heniff', label: 'Heniff Transportation' },
    { value: 'bulk_transport', label: 'Bulk Transport Company' },
    { value: 'superior_bulk', label: 'Superior Bulk Logistics' },
    { value: 'odyssey_logistics', label: 'Odyssey Logistics' },
    { value: 'nussbaum', label: 'Nussbaum Transportation' },
    
    // Intermodal & Logistics
    { value: 'hub_group', label: 'Hub Group' },
    { value: 'forward_air', label: 'Forward Air' },
    { value: 'ascent_global', label: 'Ascent Global Logistics' },
    { value: 'dupre_logistics', label: 'Dupré Logistics' },
    { value: 'jb_poindexter', label: 'J.B. Poindexter & Co' },
    { value: 'panther_premium', label: 'Panther Premium Logistics' },
    
    // Regional & Smaller Carriers
    { value: 'new_england_motor', label: 'New England Motor Freight' },
    { value: 'crst', label: 'CRST Expedited' },
    { value: 'usa_truck_inc', label: 'USA Truck Inc' },
    { value: 'veriha_trucking', label: 'Veriha Trucking' },
    { value: 'mclane', label: 'McLane Company' },
    { value: 'anderson_trucking', label: 'Anderson Trucking Service' },
    { value: 'daseke', label: 'Daseke Companies' },
    { value: 'wil_trans', label: 'Wil-Trans' },
    { value: 'navajo_express', label: 'Navajo Express' },
    { value: 'pam_logistics', label: 'PAM Logistics' },
    { value: 'carter_express', label: 'Carter Express' },
    { value: 'Interstate_distributor', label: 'Interstate Distributor' },
    { value: 'england_carrier', label: 'England Carrier Services' },
    { value: 'kllm', label: 'KLLM Transport Services' },
    { value: 'usa_transport', label: 'USA Transport' },
    { value: 'gordon_trucking', label: 'Gordon Trucking' },
    { value: 'central_refrigerated', label: 'Central Refrigerated Service' },
    { value: 'jim_palmer', label: 'Jim Palmer Trucking' },
    { value: 'wabash_national', label: 'Wabash National' },
    { value: 'montgomery_transport', label: 'Montgomery Transport' },
    { value: 'interstate_logistics', label: 'Interstate Logistics Systems' },
    { value: 'u_s_xpress', label: 'U.S. Xpress' },
    { value: 'team_run_smart', label: 'Team Run Smart' },
    { value: 'trans_states', label: 'Trans States Holdings' },
    { value: 'quality_distribution', label: 'Quality Distribution' },
    { value: 'barr_nunn', label: 'Barr-Nunn Transportation' },
    { value: 'decker_transport', label: 'Decker Transport' },
    { value: 'navajo_shippers', label: 'Navajo Shippers' },
    { value: 'hirschbach', label: 'Hirschbach Motor Lines' },
    { value: 'k_limited', label: 'K-Limited Carriers' },
    { value: 'great_coastal', label: 'Great Coastal Express' },
    { value: 'daylight_transport', label: 'Daylight Transport' },
    { value: 'builders_transport', label: 'Builders Transportation' },
    { value: 'mountain_valley', label: 'Mountain Valley Express' },
    { value: 'cci', label: 'CCI (Carolina Cargo)' },
    { value: 'ruan', label: 'Ruan Transportation' },
    { value: 'western_dairy', label: 'Western Dairy Transport' },
    { value: 'schilli', label: 'Schilli Transportation' },
    { value: 'interstate_trucking', label: 'Interstate Trucking' },
    { value: 'mccollister', label: 'McCollister Transportation' },
    { value: 'tennessee_carriers', label: 'Tennessee Truck Carriers' },
    { value: 'summit_logistics', label: 'Summit Logistics' },
    { value: 'apache_trucking', label: 'Apache Trucking' }
  ].sort((a, b) => a.label.localeCompare(b.label));

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
      
      // Filter out individual job listings - we only want feed metadata
      // Job listings have type='job_listing' and should be imported, not displayed as feeds
      const actualFeeds = processedFeeds.filter(feed => feed.type !== 'job_listing');
      const jobListings = processedFeeds.filter(feed => feed.type === 'job_listing');
      
      setFeeds(actualFeeds);
      
      toast({
        title: "Feed data loaded",
        description: `Found ${jobListings.length} job listings from ${userParam}. Importing now...`,
      });

      // Automatically import the fetched jobs
      if (jobListings.length > 0) {
        setImporting(true);
        try {
          // Construct the feed URL for import
          let feedUrl = `https://cdljobcast.com/client/recruiting/getfeeds?user=${encodeURIComponent(userParam)}`;
          if (boardParam) {
            feedUrl += `&board=${encodeURIComponent(boardParam)}`;
          }

          const { data: importData, error: importError } = await supabase.functions.invoke('import-jobs-from-feed', {
            body: { 
              feedUrl: feedUrl,
              organizationId: '84214b48-7b51-45bc-ad7f-723bcf50466c' // Hayes Recruiting Solutions
            }
          });
          
          if (importError) {
            throw new Error(`Import error: ${importError.message}`);
          }
          
          if (!importData.success) {
            throw new Error(importData.error || 'Failed to import jobs');
          }
          
          toast({
            title: "Jobs imported successfully",
            description: `${importData.message}. Total: ${importData.total}, Imported: ${importData.imported}`,
          });
        } catch (importErr) {
          const errorMessage = importErr instanceof Error ? importErr.message : 'Failed to import jobs';
          console.error('Error importing jobs:', importErr);
          toast({
            title: "Error importing jobs",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setImporting(false);
        }
      }
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
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="font-semibold mb-2">Job listings ready for import</p>
              <p className="text-muted-foreground mb-4">
                The CDL Job Cast feed contains job listings that can be imported directly.
                Click the "Import Jobs to Hayes Recruiting" button above to import them.
              </p>
              <Button onClick={fetchFeeds} variant="outline" className="mt-4">
                Refresh Feed
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Import Jobs Section - Always visible */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Jobs from CDL Job Cast</CardTitle>
            <CardDescription>
              Import job listings from the selected user's feed into Hayes Recruiting Solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => {
                const feedUrl = `https://cdljobcast.com/client/recruiting/getfeeds?user=${userParam}${boardParam ? `&board=${boardParam}` : ''}`;
                importJobsFromFeed(feedUrl);
              }}
              disabled={importing || !userParam.trim()}
              className="w-full"
              size="lg"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing Jobs...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import Jobs to Hayes Recruiting
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {!loading && feeds.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Feed Metadata ({feeds.length})
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