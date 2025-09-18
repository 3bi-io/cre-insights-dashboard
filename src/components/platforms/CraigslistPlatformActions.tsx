import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  FileText, 
  ExternalLink, 
  Copy,
  Eye,
  AlertCircle,
  MapPin,
  DollarSign,
  CheckCircle,
  XCircle,
  Upload,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const CraigslistPlatformActions: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      const url = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=craigslist';
      setFeedUrl(url);
      checkConnectionStatus();
    }
  }, [user]);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('craigslist-integration', {
        body: { action: 'status' }
      });

      if (error) throw error;
      setConnectionStatus(data);
    } catch (error) {
      console.error('Failed to check connection status:', error);
      setConnectionStatus({ connected: false, error: 'Failed to check connection' });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    await checkConnectionStatus();
    toast({
      title: connectionStatus?.connected ? "Connection successful" : "Connection failed",
      description: connectionStatus?.connected ? 
        `Connected as ${connectionStatus.username}` : 
        connectionStatus?.error || "Unable to connect to Craigslist",
      variant: connectionStatus?.connected ? "default" : "destructive"
    });
  };

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({
        title: "URL copied",
        description: "Craigslist RSS feed URL copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard",
        variant: "destructive"
      });
    }
  };

  const openFeed = () => {
    window.open(feedUrl, '_blank');
  };

  const openCraigslistInfo = () => {
    window.open('https://craigslist.org/about/bulk_posting_interface', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CL</span>
          </div>
          <div>
            <CardTitle className="text-lg">Craigslist Integration</CardTitle>
            <CardDescription>
              Generate RSS feed for Craigslist job posting automation
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            {loading ? (
              <Loader2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground animate-spin" />
            ) : connectionStatus?.connected ? (
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
            )}
            <div className="text-sm font-medium">Connection Status</div>
            <div className={`text-lg font-bold ${connectionStatus?.connected ? 'text-green-600' : 'text-red-600'}`}>
              {loading ? 'Checking...' : connectionStatus?.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">RSS Feed</div>
            <div className="text-lg font-bold text-purple-600">
              {feedUrl ? 'Active' : 'Not Set'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Coverage</div>
            <div className="text-lg font-bold text-blue-600">Nationwide</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Cost</div>
            <div className="text-lg font-bold text-green-600">Free</div>
          </div>
        </div>

        {/* Connection Status Details */}
        {connectionStatus && (
          <Alert className={connectionStatus.connected ? "border-green-200" : "border-red-200"}>
            {connectionStatus.connected ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {connectionStatus.connected ? (
                <div className="space-y-1">
                  <p className="font-medium text-green-800">Connected to Craigslist</p>
                  <p className="text-sm text-green-700">
                    Username: ****@**** | Account: ****1234
                  </p>
                  <p className="text-sm text-green-600">
                    Last checked: {new Date(connectionStatus.lastChecked).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-red-800">Connection Failed</p>
                  <p className="text-sm text-red-700">
                    {connectionStatus.error || 'Unable to connect to Craigslist'}
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          
          <Button onClick={openCraigslistInfo} variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Posting Guide
          </Button>
          
          <Button 
            onClick={() => window.open('https://accounts.craigslist.org/', '_blank')} 
            variant="outline"
          >
            <Globe className="w-4 h-4 mr-2" />
            Account Portal
          </Button>
        </div>

        {/* Feed URL Section */}
        <div className="space-y-3">
          <Label>RSS Feed URL for Third-Party Tools</Label>
          <div className="flex gap-2">
            <Input
              value={feedUrl}
              readOnly
              className="flex-1 font-mono text-sm"
              placeholder="Feed URL will appear here..."
            />
            <Button onClick={copyFeedUrl} variant="outline" size="icon" disabled={!feedUrl}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button onClick={openFeed} variant="outline" size="icon" disabled={!feedUrl}>
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Integration Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Enhanced Craigslist Integration:</p>
              <div className="text-sm space-y-1">
                <p>• Account credentials configured for API access</p>
                <p>• Direct posting capabilities (where permitted by Craigslist)</p>
                <p>• RSS feed generation for third-party automation tools</p>
                <p>• Connection monitoring and status tracking</p>
                <p>• Category management and posting optimization</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Features */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Integration Features:</strong> Authenticated account access, automated posting where supported, RSS feed compatibility, multi-city posting support, and compliance with Craigslist posting guidelines.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CraigslistPlatformActions;