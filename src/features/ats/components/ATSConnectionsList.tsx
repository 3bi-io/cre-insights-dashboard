import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  TestTube,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Send
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ATSConnection } from '@/services/atsConnectionsService';
import { useDeleteATSConnection, useTestATSConnection } from '@/hooks/useATSConnections';
import { TestAutoPostDialog } from './TestAutoPostDialog';

interface ATSConnectionsListProps {
  connections: ATSConnection[];
  organizationId: string;
  onEdit: (connection: ATSConnection) => void;
  isLoading?: boolean;
  showClientColumn?: boolean;
}

export const ATSConnectionsList: React.FC<ATSConnectionsListProps> = ({
  connections,
  organizationId,
  onEdit,
  isLoading = false,
  showClientColumn = true,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [connectionToDelete, setConnectionToDelete] = React.useState<ATSConnection | null>(null);
  const [testingConnectionId, setTestingConnectionId] = React.useState<string | null>(null);
  const [testAutoPostConnection, setTestAutoPostConnection] = React.useState<ATSConnection | null>(null);
  
  const deleteConnection = useDeleteATSConnection(organizationId);
  const testConnection = useTestATSConnection();

  const handleDelete = (connection: ATSConnection) => {
    setConnectionToDelete(connection);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (connectionToDelete) {
      await deleteConnection.mutateAsync(connectionToDelete.id);
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
    }
  };

  const handleTest = async (connection: ATSConnection) => {
    setTestingConnectionId(connection.id);
    try {
      await testConnection.mutateAsync(connection.id);
    } finally {
      setTestingConnectionId(null);
    }
  };

  const getStatusBadge = (status: string, mode: string) => {
    if (status === 'active') {
      return (
        <div className="flex items-center gap-1">
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
          {mode === 'test' && (
            <Badge variant="secondary" className="gap-1 text-yellow-600">
              <AlertTriangle className="h-3 w-3" />
              Test
            </Badge>
          )}
        </div>
      );
    }
    if (status === 'error') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        {status}
      </Badge>
    );
  };

  const getScopeIndicator = (connection: ATSConnection) => {
    if (connection.client_id) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-blue-500" />
          <span>{connection.client?.name || 'Unknown Client'}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Organization Default</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No ATS connections configured</p>
        <p className="text-sm">Add a connection to start syncing applications</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ATS System</TableHead>
            <TableHead>Connection Name</TableHead>
            {showClientColumn && <TableHead>Scope</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Auto-Post</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((connection) => (
            <TableRow key={connection.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {connection.ats_system?.name || 'Unknown'}
                  </span>
                  {connection.ats_system?.category && (
                    <Badge variant="outline" className="text-xs">
                      {connection.ats_system.category}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{connection.name}</TableCell>
              {showClientColumn && (
                <TableCell>{getScopeIndicator(connection)}</TableCell>
              )}
              <TableCell>
                {getStatusBadge(connection.status, connection.mode)}
              </TableCell>
              <TableCell>
                {connection.is_auto_post_enabled ? (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Enabled
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">Disabled</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {connection.last_sync_at 
                  ? formatDistanceToNow(new Date(connection.last_sync_at), { addSuffix: true })
                  : 'Never'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DropdownMenuItem onClick={() => onEdit(connection)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleTest(connection)}
                      disabled={testingConnectionId === connection.id}
                    >
                      {testingConnectionId === connection.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                      )}
                      Test Connection
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTestAutoPostConnection(connection)}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Test Auto-Post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(connection)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ATS Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the connection "{connectionToDelete?.name}"? 
              This action cannot be undone and will stop any automatic syncing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Auto-Post Dialog */}
      {testAutoPostConnection && (
        <TestAutoPostDialog
          open={!!testAutoPostConnection}
          onOpenChange={(open) => !open && setTestAutoPostConnection(null)}
          connection={testAutoPostConnection}
        />
      )}
    </>
  );
};
