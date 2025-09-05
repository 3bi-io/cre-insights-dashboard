import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  FileText,
  Zap,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import GoogleJobsFeedValidator from './GoogleJobsFeedValidator';

const GoogleJobsSetup: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [jobCount, setJobCount] = useState<number>(0);
  const [lastGenerated, setLastGenerated] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      const url = 'https://auwhcdpppldjlcaxzsme.supabase.co/functions/v1/job-feed-xml?platform=google%20jobs';
      setFeedUrl(url);
    }
  }, [user]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast({
        title: "Feed URL copied",
        description: "The XML feed URL has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy URL to clipboard.",
        variant: "destructive"
      });
    }
  };

  const validateFeed = async () => {
    if (!feedUrl) return;
    
    setIsValidating(true);
    try {
      const response = await fetch(feedUrl);
      
      if (response.ok) {
        const xmlText = await response.text();
        
        // Basic XML validation
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const parseError = xmlDoc.querySelector('parsererror');
        
        if (parseError) {
          setValidationStatus('invalid');
          toast({
            title: "Invalid XML",
            description: "The XML feed contains syntax errors.",
            variant: "destructive"
          });
        } else {
          // Count job items
          const items = xmlDoc.querySelectorAll('item');
          setJobCount(items.length);
          setValidationStatus('valid');
          setLastGenerated(new Date().toLocaleString());
          
          toast({
            title: "Feed validated",
            description: `XML feed is valid with ${items.length} job listings.`
          });
        }
      } else {
        setValidationStatus('invalid');
        toast({
          title: "Feed error",
          description: `Failed to fetch feed: ${response.status} ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      setValidationStatus('invalid');
      toast({
        title: "Validation failed",
        description: "Failed to validate the XML feed.",
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const openFeedInNewTab = () => {
    window.open(feedUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Google Jobs XML Feed
        </CardTitle>
        <CardDescription>
          Generate and manage your XML feed for Google Jobs platform integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feed URL Section */}
        <div className="space-y-3">
          <Label htmlFor="feed-url">XML Feed URL</Label>
          <div className="flex gap-2">
            <Input
              id="feed-url"
              value={feedUrl}
              readOnly
              className="flex-1 font-mono text-sm"
              placeholder="Feed URL will appear here..."
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              disabled={!feedUrl}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              onClick={openFeedInNewTab}
              variant="outline"
              size="icon"
              disabled={!feedUrl}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Validation Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Feed Validation</Label>
            <Button
              onClick={validateFeed}
              disabled={!feedUrl || isValidating}
              variant="outline"
              size="sm"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Validate Feed
                </>
              )}
            </Button>
          </div>

          {validationStatus !== 'idle' && (
            <Alert className={validationStatus === 'valid' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-center gap-2">
                {validationStatus === 'valid' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={validationStatus === 'valid' ? 'text-green-800' : 'text-red-800'}>
                  {validationStatus === 'valid' 
                    ? `Feed is valid and contains ${jobCount} job listings`
                    : 'Feed validation failed - check the URL and try again'
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Status Information */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Format</p>
              <p className="text-xs text-muted-foreground">Google Jobs XML RSS</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Jobs Count</p>
              <p className="text-xs text-muted-foreground">
                {jobCount > 0 ? `${jobCount} active listings` : 'Not validated yet'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-xs text-muted-foreground">
                {lastGenerated || 'Never'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Integration Instructions */}
        <div className="space-y-3">
          <h4 className="font-medium">Google Jobs Integration Steps</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <p>Copy the XML feed URL above</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <p>Submit the feed URL to Google Jobs Publisher Center</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <p>Ensure your jobs include required fields (title, description, location, company)</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <p>Monitor feed validation status and update regularly</p>
            </div>
          </div>
        </div>

        {/* Feed Validator */}
        <GoogleJobsFeedValidator feedUrl={feedUrl} />

        {/* XML Format Information */}
        <Alert>
          <FileText className="w-4 h-4" />
          <AlertDescription>
            This XML feed follows Google Jobs specifications including RSS 2.0 format with Google Base namespace extensions.
            The feed automatically includes job title, description, location, company, salary, job type, and application URL.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default GoogleJobsSetup;