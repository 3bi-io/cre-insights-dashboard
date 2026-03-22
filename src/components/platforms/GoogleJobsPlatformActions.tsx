import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Globe, 
  FileText, 
  ExternalLink, 
  CheckCircle2,
  Loader2,
  Copy,
  Eye,
  AlertCircle,
  Search,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const GoogleJobsPlatformActions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [jobCount, setJobCount] = useState(0);
  const [lastValidated, setLastValidated] = useState('');
  const [isNotifying, setIsNotifying] = useState(false);
  const [lastNotified, setLastNotified] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user?.id) {
      const url = `https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/google-jobs-xml?user_id=${user.id}`;
      setFeedUrl(url);
      
      // Auto-fetch job count on mount
      fetch(url)
        .then(res => res.ok ? res.text() : Promise.reject())
        .then(xmlText => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
          if (!xmlDoc.querySelector('parsererror')) {
            const items = xmlDoc.querySelectorAll('url, item');
            setJobCount(items.length);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const validateFeed = async () => {
    if (!feedUrl) return;
    
    setIsValidating(true);
    try {
      const response = await fetch(feedUrl);
      
      if (response.ok) {
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const parseError = xmlDoc.querySelector('parsererror');
        
        if (!parseError) {
          const items = xmlDoc.querySelectorAll('url, item');
          setJobCount(items.length);
          setLastValidated(new Date().toLocaleString());
          
          toast({
            title: "Feed validated successfully",
            description: `Found ${items.length} active job listings`
          });
        } else {
          throw new Error('Invalid XML format');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Validation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const copyFeedUrl = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({
        title: "URL copied",
        description: "Google Jobs feed URL copied to clipboard"
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

  const openGoogleJobsConsole = () => {
    window.open('https://developers.google.com/search/docs/appearance/structured-data/job-posting', '_blank');
  };

  const notifyGoogle = async () => {
    setIsNotifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-indexing', {
        body: { action: 'publish_from_feed', feed_url: feedUrl }
      });

      if (error) throw error;

      const result = data as { total: number; successes: number; failures: number; errors: string[] };
      
      setLastNotified(new Date().toLocaleString());
      
      if (result.failures > 0) {
        toast({
          title: "Partially successful",
          description: `Notified Google about ${result.successes}/${result.total} jobs. ${result.failures} failed.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Google notified successfully",
          description: `Successfully notified Google about ${result.successes} job listings`
        });
      }
    } catch (error) {
      toast({
        title: "Notification failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <CardTitle className="text-lg">Google Jobs Integration</CardTitle>
            <CardDescription>
              Manage your Google Jobs XML feed and search appearance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">XML Feed Status</div>
            <div className="text-lg font-bold text-blue-600">
              {feedUrl ? 'Active' : 'Not Set'}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Job Listings</div>
            <div className="text-lg font-bold text-green-600">{jobCount}</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">Last Notified</div>
            <div className="text-xs text-purple-600">{lastNotified || 'Never'}</div>
          </div>
        </div>

        {/* Feed URL Section */}
        <div className="space-y-3">
          <Label>Google Jobs XML Feed URL</Label>
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
          <Button 
            onClick={validateFeed}
            disabled={!feedUrl || isValidating}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Validate Feed
              </>
            )}
          </Button>
          
          <Button 
            onClick={notifyGoogle}
            disabled={isNotifying}
            variant="secondary"
            className="flex-1"
          >
            {isNotifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Notifying...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Notify Google
              </>
            )}
          </Button>
          
          <Button onClick={openGoogleJobsConsole} variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" />
            Docs
          </Button>
        </div>

        {/* Integration Instructions */}
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Google Jobs Integration Steps:</p>
              <div className="text-sm space-y-1">
                <p>1. Copy your XML feed URL above</p>
                <p>2. Add structured data markup to your job postings</p>
                <p>3. Submit your site to Google Search Console</p>
                <p>4. Monitor your jobs in Google Search results</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Feed Information */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>How Google Jobs Works:</strong> This integration generates an XML Sitemap containing URLs to your job pages. Each job page automatically includes JobPosting JSON-LD structured data that Google crawls to display your jobs in search results. The sitemap helps Google discover all your job listings efficiently.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GoogleJobsPlatformActions;