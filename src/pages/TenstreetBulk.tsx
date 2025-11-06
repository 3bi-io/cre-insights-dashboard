import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, RefreshCw, Database } from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import BulkImport from '@/components/tenstreet/BulkImport';
import BulkExport from '@/components/tenstreet/BulkExport';
import BulkStatusUpdate from '@/components/tenstreet/BulkStatusUpdate';
import SyncOperations from '@/components/tenstreet/SyncOperations';

export default function TenstreetBulk() {
  const { operations, isLoading } = useBulkOperations();
  const [activeTab, setActiveTab] = useState('import');

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      processing: 'default',
      completed: 'secondary',
      failed: 'destructive',
      cancelled: 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'import': return <Upload className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      case 'sync_facebook':
      case 'sync_hubspot': return <RefreshCw className="h-4 w-4" />;
      case 'status_update': return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tenstreet Bulk Operations</h1>
        <p className="text-muted-foreground">
          Import, export, and manage applicant data in bulk
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="status">
            <Database className="h-4 w-4 mr-2" />
            Status Update
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <BulkImport />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <BulkExport />
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <BulkStatusUpdate />
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <SyncOperations />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
          <CardDescription>View the status of your bulk operations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading operations...</div>
          ) : operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No operations yet</div>
          ) : (
            <div className="space-y-3">
              {operations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getOperationIcon(op.operation_type)}
                    <div>
                      <div className="font-medium capitalize">
                        {op.operation_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(op.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-right">
                      <div className="font-medium">
                        {op.success_records} / {op.total_records}
                      </div>
                      <div className="text-muted-foreground">
                        {op.failed_records > 0 && `${op.failed_records} failed`}
                      </div>
                    </div>
                    {getStatusBadge(op.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
