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
  ExternalLink, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ZipRecruiterPlatformActions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [jobPostings, setJobPostings] = useState<any[]>([]);
  const { toast } = useToast();

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ziprecruiter-integration', {
        body: { action: 'test_connection' }
      });

      if (error) throw error;

      if (data?.connected) {
        setIsConnected(true);
        toast({
          title: "Connected Successfully",
          description: data.message || "ZipRecruiter integration is active"
        });
      } else {
        toast({
          title: "Connection Issue",
          description: data?.message || "Could not verify connection",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to ZipRecruiter",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ziprecruiter-integration', {
        body: { action: 'get_analytics' }
      });

      if (error) throw error;

      if (data?.totals) {
        setStats(data.totals);
        toast({
          title: "Analytics Retrieved",
          description: `Fetched data for ${data.period?.days || 30} days`
        });
      }
    } catch (error: any) {
      toast({
        title: "Analytics Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchJobPostings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ziprecruiter-integration', {
        body: { action: 'get_job_postings' }
      });

      if (error) throw error;

      if (data?.postings) {
        setJobPostings(data.postings);
        toast({
          title: "Job Postings Retrieved",
          description: `Found ${data.postings.length} job postings`
        });
      }
    } catch (error: any) {
      toast({
        title: "Failed to fetch postings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <div className="text-sm font-medium">Job Postings</div>
            <div className="text-2xl font-bold text-green-600">{jobPostings.length || 0}</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Eye className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-sm font-medium">Views</div>
            <div className="text-2xl font-bold text-blue-600">{stats?.views?.toLocaleString() || 0}</div>
          </div>
          
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <div className="text-sm font-medium">Applications</div>
            <div className="text-2xl font-bold text-purple-600">{stats?.applications || 0}</div>
          </div>

          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <div className="text-sm font-medium">Status</div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="mt-1">
              {isConnected ? 'Connected' : 'Not Connected'}
            </Badge>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Total Spend</div>
              <div className="text-xl font-bold">${stats.spend?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">CTR</div>
              <div className="text-xl font-bold">{stats.ctr || 0}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
              <div className="text-xl font-bold">{stats.conversion_rate || 0}%</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Cost per Application</div>
              <div className="text-xl font-bold">${stats.cpa || '0.00'}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleTestConnection}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>
          
          <Button 
            onClick={handleFetchAnalytics}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Fetch Analytics
          </Button>

          <Button 
            onClick={handleFetchJobPostings}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-2" />
            )}
            Get Job Postings
          </Button>
          
          <Button 
            onClick={() => window.open('https://www.ziprecruiter.com/api/documentation', '_blank')}
            variant="outline"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            API Docs
          </Button>
        </div>

        {jobPostings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Active Job Postings</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {jobPostings.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground">Posted: {job.posted_date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{job.applications} apps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>ZipRecruiter Integration:</strong> Configure your ZIPRECRUITER_API_KEY in the 
            environment secrets to enable real job posting sync and analytics. Without credentials, 
            the system provides simulated data for demonstration.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ZipRecruiterPlatformActions;