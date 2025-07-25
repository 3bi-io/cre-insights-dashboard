import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIndeedData } from '@/hooks/useIndeedData';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Download, RefreshCw } from 'lucide-react';
const IndeedPlatformActions = () => {
  const [employerId, setEmployerId] = useState('');
  const {
    data,
    isLoading,
    error,
    fetchIndeedStats,
    fetchEmployers
  } = useIndeedData();
  const {
    toast
  } = useToast();
  const handleFetchStats = async () => {
    if (!employerId.trim()) {
      toast({
        title: "Error",
        description: "Please enter an employer ID",
        variant: "destructive"
      });
      return;
    }
    await fetchIndeedStats(employerId);
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Indeed data fetched successfully"
      });
    }
  };
  const handleFetchEmployers = async () => {
    const employers = await fetchEmployers();
    if (employers) {
      toast({
        title: "Employers Retrieved",
        description: `Found ${employers.length || 0} employers`
      });
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Indeed Analytics
        </CardTitle>
        <CardDescription>
          Connect and fetch analytics data from Indeed's reporting API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employerId">Employer ID</Label>
          <Input id="employerId" placeholder="Enter Indeed employer ID" value={employerId} onChange={e => setEmployerId(e.target.value)} />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleFetchStats} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Fetch Stats
          </Button>
          
          
        </div>

        {data && data.length > 0 && <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Latest Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Spend: ${data[0]?.spend || 0}</div>
              <div>Clicks: {data[0]?.clicks || 0}</div>
              <div>Impressions: {data[0]?.impressions || 0}</div>
              <div>CTR: {data[0]?.ctr || 0}%</div>
            </div>
          </div>}
      </CardContent>
    </Card>;
};
export default IndeedPlatformActions;