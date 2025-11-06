import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import XchangeManager from '@/components/tenstreet/XchangeManager';
import { useTenstreetConfiguration } from '@/hooks/useTenstreetConfiguration';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TenstreetXchange() {
  const navigate = useNavigate();
  const { credentials } = useTenstreetConfiguration();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  if (!credentials) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <AlertDescription>
            Please configure Tenstreet credentials first in the Integrations settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const companyId = credentials.company_ids?.[0] || '';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/integrations')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Integrations
        </Button>
        <h1 className="text-3xl font-bold mb-2">Tenstreet Xchange</h1>
        <p className="text-muted-foreground">
          Manage background checks, MVR requests, drug tests, and employment verifications
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mvr">MVR Checks</TabsTrigger>
          <TabsTrigger value="drug">Drug Tests</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="background">Background Checks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Applicant</CardTitle>
              <CardDescription>
                Enter application or driver details to view and manage verifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Search by application ID or driver ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Demo with all verifications */}
          <XchangeManager
            companyId={companyId}
            applicationId={selectedApplicationId || undefined}
            driverId={selectedDriverId || undefined}
          />
        </TabsContent>

        <TabsContent value="mvr" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Motor Vehicle Record (MVR) Checks</CardTitle>
              <CardDescription>
                Request and track MVR checks for commercial drivers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XchangeManager
                companyId={companyId}
                applicationId={selectedApplicationId || undefined}
                driverId={selectedDriverId || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drug" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Drug Test Screenings</CardTitle>
              <CardDescription>
                Schedule and track pre-employment and random drug tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XchangeManager
                companyId={companyId}
                applicationId={selectedApplicationId || undefined}
                driverId={selectedDriverId || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employment Verifications</CardTitle>
              <CardDescription>
                Verify employment history through The Work Number integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XchangeManager
                companyId={companyId}
                applicationId={selectedApplicationId || undefined}
                driverId={selectedDriverId || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Criminal Background Checks</CardTitle>
              <CardDescription>
                Order and review criminal history reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <XchangeManager
                companyId={companyId}
                applicationId={selectedApplicationId || undefined}
                driverId={selectedDriverId || undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
