import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const CraigslistPlatformActions: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.id) {
      const url = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=craigslist';
      setFeedUrl(url);
    }
  }, [user]);

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
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <FileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">RSS Feed Status</div>
            <div className="text-lg font-bold text-purple-600">
              {feedUrl ? 'Active' : 'Not Set'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Market Coverage</div>
            <div className="text-lg font-bold text-blue-600">Nationwide</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Cost</div>
            <div className="text-lg font-bold text-green-600">Free</div>
          </div>
        </div>

        {/* Feed URL Section */}
        <div className="space-y-3">
          <Label>Craigslist RSS Feed URL</Label>
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={openCraigslistInfo} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Bulk Posting Info
          </Button>
          
          <Button 
            onClick={() => window.open('https://craigslist.org/', '_blank')} 
            variant="outline"
          >
            <Globe className="w-4 h-4 mr-2" />
            Visit Site
          </Button>
        </div>

        {/* Integration Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Craigslist Posting Guidelines:</p>
              <div className="text-sm space-y-1">
                <p>1. Craigslist requires manual posting for most job categories</p>
                <p>2. Use the RSS feed with third-party automation tools</p>
                <p>3. Follow Craigslist's Terms of Use and posting guidelines</p>
                <p>4. Consider posting in multiple relevant city locations</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Features */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>RSS Feed Features:</strong> Generates Craigslist-compatible RSS format with job titles, descriptions, locations, and compensation details for automated posting tools.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default CraigslistPlatformActions;