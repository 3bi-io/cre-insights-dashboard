import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useEffectiveATSConnections, 
  useATSSystems,
  useDeleteATSConnection,
  useTestATSConnection,
  useClientATSConnections
} from '@/hooks/useATSConnections';
import { ATSConnectionDialog } from '@/features/ats/components/ATSConnectionDialog';
import type { ATSConnection, ATSSystem } from '@/services/atsConnectionsService';
import { 
  Building2, 
  Link2, 
  Settings, 
  Edit, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Play
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ClientATSSettingsProps {
  clientId: string;
  clientName: string;
  organizationId: string;
}

export const ClientATSSettings: React.FC<ClientATSSettingsProps> = ({
  clientId,
  clientName,
  organizationId,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingConnection, setEditingConnection] = useState<ATSConnection | null>(null);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

  const { data: effectiveConnections, isLoading: loadingEffective } = useEffectiveATSConnections(
    organizationId,
    clientId
  );
  const { data: clientConnections, isLoading: loadingClientConns } = useClientATSConnections(
    organizationId,
    clientId
  );
  const { data: atsSystems, isLoading: loadingSystems } = useATSSystems();
  const deleteConnection = useDeleteATSConnection(organizationId);
  const testConnection = useTestATSConnection();

  const isLoading = loadingEffective || loadingSystems || loadingClientConns;

  const handleCustomize = () => {
    setEditingConnection(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (connection: ATSConnection) => {
    setEditingConnection(connection);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleResetToDefault = (connectionId: string) => {
    setConnectionToDelete(connectionId);
  };

  const confirmDelete = () => {
    if (connectionToDelete) {
      deleteConnection.mutate(connectionToDelete);
      setConnectionToDelete(null);
    }
  };

  const handleTest = (connectionId: string) => {
    testConnection.mutate(connectionId);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingConnection(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Build a map of client-specific connections by ATS system ID
  const clientConnectionMap = new Map<string, ATSConnection>();
  clientConnections?.forEach(conn => {
    clientConnectionMap.set(conn.ats_system_id, conn);
  });

  // Group by ATS system with effective connection info
  const systemsWithConnections = atsSystems?.map(system => {
    const effective = effectiveConnections?.find(ec => ec.ats_system_id === system.id);
    const clientConn = clientConnectionMap.get(system.id);
    
    return {
      system,
      effectiveInfo: effective,
      clientConnection: clientConn || null,
      isInherited: effective?.source === 'organization',
      hasConnection: effective?.source !== 'none' && !!effective?.connection_id,
    };
  }) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">ATS Integrations</h3>
        </div>
        <Button size="sm" variant="outline" onClick={handleCustomize}>
          <Settings className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {systemsWithConnections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No ATS systems configured. Configure organization defaults in the ATS Command Center.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {systemsWithConnections.map(({ system, effectiveInfo, clientConnection, isInherited, hasConnection }) => (
            <Card key={system.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {system.logo_url ? (
                      <img 
                        src={system.logo_url} 
                        alt={system.name} 
                        className="h-8 w-8 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{system.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {system.category || 'ATS Integration'}
                      </CardDescription>
                    </div>
                  </div>
                  {hasConnection && (
                    <Badge 
                      variant={isInherited ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {isInherited ? (
                        <><Building2 className="h-3 w-3 mr-1" /> Organization Default</>
                      ) : (
                        <><Settings className="h-3 w-3 mr-1" /> Custom</>
                      )}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {hasConnection && effectiveInfo ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Connection:</span>
                      <span className="font-medium">{effectiveInfo.connection_name}</span>
                    </div>
                    {effectiveInfo.mode && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Mode:</span>
                        <Badge variant={effectiveInfo.mode === 'production' ? 'default' : 'outline'} className="text-xs">
                          {effectiveInfo.mode}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge 
                        variant={effectiveInfo.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {effectiveInfo.status === 'active' ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> {effectiveInfo.status}</>
                        )}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      {effectiveInfo.connection_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(effectiveInfo.connection_id!)}
                          disabled={testConnection.isPending}
                        >
                          {testConnection.isPending ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Test
                        </Button>
                      )}
                      
                      {isInherited ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCustomize}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Customize
                        </Button>
                      ) : clientConnection ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(clientConnection)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetToDefault(clientConnection.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset to Default
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      No connection configured
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCustomize}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure for {clientName}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Connection Dialog */}
      <ATSConnectionDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        organizationId={organizationId}
        clientId={clientId}
        clientName={clientName}
        connection={editingConnection}
        mode={dialogMode}
      />

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={!!connectionToDelete} onOpenChange={() => setConnectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Organization Default?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the custom ATS configuration for this client. 
              The client will use the organization's default settings instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Reset to Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientATSSettings;
