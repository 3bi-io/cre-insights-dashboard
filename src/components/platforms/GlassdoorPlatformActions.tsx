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
  Star,
  Building2,
  Users2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const GlassdoorPlatformActions: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.id) {
      const url = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=glassdoor';
      setFeedUrl(url);
    }
  }, [user]);

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({
        title: "URL copied",
        description: "Glassdoor XML feed URL copied to clipboard"
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

  const openGlassdoorAPI = () => {
    window.open('https://developers.glassdoor.com/api/', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-green-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">GD</span>
          </div>
          <div>
            <CardTitle className="text-lg">Glassdoor Integration</CardTitle>
            <CardDescription>
              XML feed and API integration for Glassdoor job posting
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">XML Feed Status</div>
            <div className="text-lg font-bold text-green-600">
              {feedUrl ? 'Active' : 'Not Set'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Users2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Monthly Users</div>
            <div className="text-lg font-bold text-blue-600">59M+</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Star className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <div className="text-sm font-medium">Company Reviews</div>
            <div className="text-lg font-bold text-yellow-600">Enhanced</div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="space-y-3">
          <Label>Glassdoor API Key (Optional)</Label>
          <Input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Glassdoor API key for enhanced features"
            type="password"
          />
        </div>

        {/* Feed URL Section */}
        <div className="space-y-3">
          <Label>Glassdoor XML Feed URL</Label>
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
          <Button onClick={openGlassdoorAPI} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Developer API
          </Button>
          
          <Button 
            onClick={() => window.open('https://www.glassdoor.com/employers/', '_blank')} 
            variant="outline"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Employer Center
          </Button>
        </div>

        {/* Key Features */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-sm">Company Branding</div>
            <div className="text-xs text-muted-foreground">Enhanced company profiles and reviews</div>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="font-medium text-sm">Salary Intelligence</div>
            <div className="text-xs text-muted-foreground">Competitive salary insights and data</div>
          </div>
        </div>

        {/* Integration Instructions */}
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Glassdoor Integration Steps:</p>
              <div className="text-sm space-y-1">
                <p>1. Create a Glassdoor Employer account</p>
                <p>2. Apply for API access (optional, for enhanced features)</p>
                <p>3. Submit XML feed URL or use API integration</p>
                <p>4. Optimize company profile and encourage reviews</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Feed Information */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>XML Feed Features:</strong> Generates Glassdoor-compatible XML format with detailed job information, company data, employment types, and salary details for professional job seekers.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GlassdoorPlatformActions;