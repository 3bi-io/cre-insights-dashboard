import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SyncOperations() {
  const { syncData, isSyncing } = useBulkOperations();
  const [fbCompanyId, setFbCompanyId] = useState<string>('');
  const [fbAdAccountId, setFbAdAccountId] = useState<string>('');
  const [hsCompanyId, setHsCompanyId] = useState<string>('');
  const [hsCredentials, setHsCredentials] = useState<string>('');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync from Facebook
          </CardTitle>
          <CardDescription>
            Sync applicants from Facebook Lead Ads to Tenstreet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This will import all new leads from Facebook Lead Ads and create applicant records in Tenstreet.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label>Tenstreet Company ID</Label>
            <Input
              placeholder="Enter Tenstreet Company ID"
              value={fbCompanyId}
              onChange={(e) => setFbCompanyId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Facebook Ad Account ID</Label>
            <Input
              placeholder="Enter Facebook Ad Account ID"
              value={fbAdAccountId}
              onChange={(e) => setFbAdAccountId(e.target.value)}
            />
          </div>
          <Button
            onClick={() => syncData({ 
              source: 'facebook', 
              companyId: fbCompanyId,
              adAccountId: fbAdAccountId
            })}
            disabled={!fbCompanyId || !fbAdAccountId || isSyncing}
            className="w-full"
          >
            {isSyncing ? 'Syncing...' : 'Sync from Facebook'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync from HubSpot
          </CardTitle>
          <CardDescription>
            Sync contacts from HubSpot CRM to Tenstreet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This will import contacts from HubSpot and create or update applicant records in Tenstreet.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label>Tenstreet Company ID</Label>
            <Input
              placeholder="Enter Tenstreet Company ID"
              value={hsCompanyId}
              onChange={(e) => setHsCompanyId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>HubSpot Credentials (JSON)</Label>
            <Input
              placeholder='{"apiKey": "your-api-key"}'
              value={hsCredentials}
              onChange={(e) => setHsCredentials(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              try {
                const creds = hsCredentials ? JSON.parse(hsCredentials) : {};
                syncData({ 
                  source: 'hubspot', 
                  companyId: hsCompanyId,
                  credentials: creds
                });
              } catch (e) {
                // Handle invalid JSON
              }
            }}
            disabled={!hsCompanyId || isSyncing}
            className="w-full"
          >
            {isSyncing ? 'Syncing...' : 'Sync from HubSpot'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
