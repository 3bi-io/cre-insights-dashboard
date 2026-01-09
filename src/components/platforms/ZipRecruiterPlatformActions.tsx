import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  Users, 
  Download, 
  ExternalLink, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ZipRecruiterPlatformActions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [companyId, setCompanyId] = useState('');
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!apiKey || !companyId) {
      toast({
        title: "Missing Information",
        description: "Please provide both API key and Company ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Connected Successfully",
        description: "ZipRecruiter integration is now active"
      });
      
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to ZipRecruiter. Please check your credentials.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openZipRecruiterDocs = () => {
    window.open('https://www.ziprecruiter.com/api/documentation', '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/7d10dee2-7442-4d14-8a26-bb7f417bd5e8.png" 
            alt="ZipRecruiter" 
            className="w-8 h-8"
          />
          <div>
            <CardTitle className="text-lg">ZipRecruiter Integration</CardTitle>
            <CardDescription>
              Connect your ZipRecruiter account to sync job postings and analytics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Connect your ZipRecruiter account to sync job postings and track applications automatically.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Job Postings</div>
            <div className="text-2xl font-bold text-green-600">0</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Applications</div>
            <div className="text-2xl font-bold text-blue-600">0</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">Response Rate</div>
            <div className="text-2xl font-bold text-purple-600">0%</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">ZipRecruiter API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your ZipRecruiter API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyId">Company ID</Label>
            <Input
              id="companyId"
              placeholder="Enter your ZipRecruiter Company ID"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleConnect}
            disabled={isLoading || !apiKey || !companyId}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Connect Account
              </>
            )}
          </Button>
          
          <Button 
            onClick={openZipRecruiterDocs}
            variant="outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            API Docs
          </Button>
        </div>

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Coming Soon:</strong> Automatic job posting synchronization, application tracking, 
            and performance analytics for your ZipRecruiter campaigns.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ZipRecruiterPlatformActions;