import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://auwhcdpppldjlcaxzsme.supabase.co';

export const UniversalFeedManager = () => {
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<'indeed' | 'google' | 'generic'>('generic');
  const [feedUrl, setFeedUrl] = useState('');

  // Fetch organizations
  const { data: organizations, isLoading: isLoadingOrgs, error: orgsError } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's organization
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id, organizations(id, name, slug)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Set default organization
  useEffect(() => {
    if (userProfile?.organization_id && !selectedOrg) {
      setSelectedOrg(userProfile.organization_id);
    }
  }, [userProfile, selectedOrg]);

  // Fetch clients for selected organization
  const { data: clients, isLoading: isLoadingClients, error: clientsError, refetch: refetchClients } = useQuery({
    queryKey: ['clients', selectedOrg],
    queryFn: async () => {
      if (!selectedOrg) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company, status')
        .eq('organization_id', selectedOrg)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrg,
  });

  // Fetch feed stats
  const { data: feedStats } = useQuery({
    queryKey: ['feed-stats', selectedOrg, selectedClient],
    queryFn: async () => {
      if (!selectedOrg) return null;

      let query = supabase
        .from('job_listings')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', selectedOrg)
        .eq('status', 'active');

      if (selectedClient && selectedClient !== 'all') {
        query = query.eq('client_id', selectedClient);
      }

      const { count, error } = await query;
      if (error) throw error;

      return { jobCount: count || 0 };
    },
    enabled: !!selectedOrg,
  });

  // Generate feed URL
  useEffect(() => {
    if (!selectedOrg) {
      setFeedUrl('');
      return;
    }

    let url = `${SUPABASE_URL}/functions/v1/universal-xml-feed?organization_id=${selectedOrg}`;
    
    if (selectedClient && selectedClient !== 'all') {
      url += `&client_id=${selectedClient}`;
    }
    
    if (selectedFormat !== 'generic') {
      url += `&format=${selectedFormat}`;
    }

    setFeedUrl(url);
  }, [selectedOrg, selectedClient, selectedFormat]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(feedUrl);
    toast.success('Feed URL copied to clipboard');
  };

  const openPreview = () => {
    window.open(feedUrl, '_blank');
  };

  if (isLoadingOrgs || isLoadingProfile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we load your data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (orgsError || profileError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription className="text-destructive">
              {orgsError?.message || profileError?.message || 'Failed to load data'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Organizations</CardTitle>
            <CardDescription>No organizations found. Please contact your administrator.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feed Configuration</CardTitle>
          <CardDescription>
            Configure your universal XML feed for external job boards and aggregators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger id="organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient} disabled={isLoadingClients}>
                <SelectTrigger id="client">
                  <SelectValue placeholder={isLoadingClients ? "Loading..." : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Feed Format</Label>
              <Select value={selectedFormat} onValueChange={(val: any) => setSelectedFormat(val)}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">Generic XML</SelectItem>
                  <SelectItem value="indeed">Indeed Format</SelectItem>
                  <SelectItem value="google">Google Jobs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {feedStats && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{feedStats.jobCount} active jobs</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {feedUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Feed URL</CardTitle>
            <CardDescription>
              Use this URL to integrate with external job boards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={feedUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyToClipboard} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
              <Button onClick={openPreview} variant="outline" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2">
              <h4 className="font-semibold text-sm">Integration Examples</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium mb-1">cURL:</p>
                  <code className="block bg-background p-2 rounded text-xs overflow-x-auto">
                    curl "{feedUrl}"
                  </code>
                </div>
                <div>
                  <p className="font-medium mb-1">Python:</p>
                  <code className="block bg-background p-2 rounded text-xs overflow-x-auto">
                    import requests{'\n'}
                    response = requests.get("{feedUrl}"){'\n'}
                    print(response.text)
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
