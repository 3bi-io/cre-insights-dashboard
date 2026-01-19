import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Building2, Users, RefreshCw, Loader2 } from 'lucide-react';
import { ATSConnectionsList } from './ATSConnectionsList';
import { ATSConnectionDialog } from './ATSConnectionDialog';
import { 
  useOrganizationATSConnections, 
  useClientATSConnections,
  useATSSystems
} from '@/hooks/useATSConnections';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ATSConnection } from '@/services/atsConnectionsService';

interface ATSConnectionsDashboardProps {
  organizationId: string;
}

export const ATSConnectionsDashboard: React.FC<ATSConnectionsDashboardProps> = ({
  organizationId,
}) => {
  const [activeTab, setActiveTab] = useState('organization');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedConnection, setSelectedConnection] = useState<ATSConnection | null>(null);
  const [isForClient, setIsForClient] = useState(false);

  const { data: atsSystems } = useATSSystems();
  const { 
    data: orgConnections, 
    isLoading: orgLoading,
    refetch: refetchOrg
  } = useOrganizationATSConnections(organizationId);
  const { 
    data: clientConnections, 
    isLoading: clientLoading,
    refetch: refetchClient
  } = useClientATSConnections(organizationId);

  // Fetch clients for the dropdown
  const { data: clients } = useQuery({
    queryKey: ['clients-for-ats', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const selectedClient = clients?.find(c => c.id === selectedClientId);
  const filteredClientConnections = selectedClientId !== 'all'
    ? clientConnections?.filter(c => c.client_id === selectedClientId)
    : clientConnections;

  const handleAddConnection = (forClient: boolean) => {
    setDialogMode('create');
    setSelectedConnection(null);
    setIsForClient(forClient);
    setDialogOpen(true);
  };

  const handleEditConnection = (connection: ATSConnection) => {
    setDialogMode('edit');
    setSelectedConnection(connection);
    setIsForClient(!!connection.client_id);
    setDialogOpen(true);
  };

  const handleRefresh = () => {
    refetchOrg();
    refetchClient();
  };

  // Calculate stats
  const totalOrgConnections = orgConnections?.length || 0;
  const totalClientConnections = clientConnections?.length || 0;
  const activeConnections = [...(orgConnections || []), ...(clientConnections || [])]
    .filter(c => c.status === 'active').length;
  const clientsWithOverrides = new Set(clientConnections?.map(c => c.client_id)).size;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATS Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atsSystems?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Available integrations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Org Defaults</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrgConnections}</div>
            <p className="text-xs text-muted-foreground">Organization-level connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Overrides</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClientConnections}</div>
            <p className="text-xs text-muted-foreground">
              Across {clientsWithOverrides} client{clientsWithOverrides !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeConnections}</div>
            <p className="text-xs text-muted-foreground">Ready for syncing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ATS Connections</CardTitle>
              <CardDescription>
                Manage ATS credentials for your organization and individual clients
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization Defaults
                {totalOrgConnections > 0 && (
                  <Badge variant="secondary">{totalOrgConnections}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Client Overrides
                {totalClientConnections > 0 && (
                  <Badge variant="secondary">{totalClientConnections}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  These credentials are used by default for all clients unless overridden.
                </p>
                <Button onClick={() => handleAddConnection(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Default Connection
                </Button>
              </div>

              <ATSConnectionsList
                connections={orgConnections || []}
                organizationId={organizationId}
                onEdit={handleEditConnection}
                isLoading={orgLoading}
                showClientColumn={false}
              />
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Filter by client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {selectedClientId !== 'all'
                      ? `Showing connections for ${selectedClient?.name}`
                      : 'Showing all client-specific connections'}
                  </p>
                </div>
                <Button onClick={() => handleAddConnection(true)} disabled={selectedClientId === 'all'}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client Connection
                </Button>
              </div>

              {selectedClientId === 'all' && (
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <strong>Tip:</strong> Select a client from the dropdown to add client-specific 
                  credentials that override the organization defaults.
                </div>
              )}

              <ATSConnectionsList
                connections={filteredClientConnections || []}
                organizationId={organizationId}
                onEdit={handleEditConnection}
                isLoading={clientLoading}
                showClientColumn={selectedClientId === 'all'}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Connection Dialog */}
      <ATSConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizationId={organizationId}
        clientId={isForClient && selectedClientId !== 'all' ? selectedClientId : null}
        clientName={isForClient && selectedClientId !== 'all' ? selectedClient?.name : undefined}
        connection={selectedConnection}
        mode={dialogMode}
      />
    </div>
  );
};
