import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MapPin, Mail, Phone, Building, Eye, MoreHorizontal, Edit, Trash2, Truck } from 'lucide-react';
import { ATSConnectionDialog } from '@/features/ats/components/ATSConnectionDialog';
import { useATSSystems } from '@/hooks/useATSConnections';
import type { Client, ConsolidatedClient } from '../types/client.types';

interface ClientsTableProps {
  clients: Client[];
  organizationId?: string;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ 
  clients, 
  organizationId,
  onEditClient,
  onDeleteClient 
}) => {
  const navigate = useNavigate();
  const { data: atsSystems } = useATSSystems();
  
  // Quick Add Tenstreet dialog state
  const [quickAddClient, setQuickAddClient] = useState<{ id: string; name: string } | null>(null);
  
  // Find Tenstreet system ID
  const tenstreetSystem = atsSystems?.find(s => s.slug === 'tenstreet');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      case 'inactive':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Consolidate clients by name to avoid duplicates
  const consolidatedClients = useMemo(() => {
    const clientMap = new Map<string, ConsolidatedClient & { clientId: string }>();

    clients.forEach(client => {
      const key = client.name;
      
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: client.name,
          clientId: client.id, // Store the first client ID for quick actions
          locations: [],
          totalLocations: 0,
          status: client.status,
          latestDate: client.created_at,
          emails: [],
          phones: []
        });
      }

      const consolidated = clientMap.get(key)!;
      
      // Add location if not already present
      if (client.city && client.state) {
        const location = `${client.city}, ${client.state}`;
        if (!consolidated.locations.includes(location)) {
          consolidated.locations.push(location);
        }
      }
      
      // Add email if not already present
      if (client.email && !consolidated.emails.includes(client.email)) {
        consolidated.emails.push(client.email);
      }
      
      // Add phone if not already present
      if (client.phone && !consolidated.phones.includes(client.phone)) {
        consolidated.phones.push(client.phone);
      }
      
      // Update latest date
      if (new Date(client.created_at) > new Date(consolidated.latestDate)) {
        consolidated.latestDate = client.created_at;
      }
      
      consolidated.totalLocations++;
    });

    return Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [clients]);

  const handleQuickAddTenstreet = (clientId: string, clientName: string) => {
    setQuickAddClient({ id: clientId, name: clientName });
  };

  const handleViewJobs = (clientName: string) => {
    // Navigate to jobs page with client filter
    navigate(`/admin/jobs?client=${encodeURIComponent(clientName)}`);
  };

  const handleEditClient = (clientName: string) => {
    // Find the first client with this name to edit
    const clientToEdit = clients.find(c => c.name === clientName);
    if (clientToEdit && onEditClient) {
      onEditClient(clientToEdit);
    }
  };

  const handleDeleteClient = (clientName: string) => {
    // Find the first client with this name to delete
    const clientToDelete = clients.find(c => c.name === clientName);
    if (clientToDelete && onDeleteClient) {
      onDeleteClient(clientToDelete.id);
    }
  };

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-sm">Start by adding your first client or adjust your search filters.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latest Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidatedClients.map((client) => (
                <TableRow key={client.name} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{client.name}</span>
                      {client.totalLocations > 1 && (
                        <span className="text-sm text-muted-foreground">
                          {client.totalLocations} locations
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {client.locations.slice(0, 3).map((location, index) => (
                        <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{location}</span>
                        </div>
                      ))}
                      {client.locations.length > 3 && (
                        <span className="text-xs text-muted-foreground ml-4">
                          +{client.locations.length - 3} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {client.emails.slice(0, 2).map((email, index) => (
                        <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[150px]">{email}</span>
                        </div>
                      ))}
                      {client.phones.slice(0, 2).map((phone, index) => (
                        <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{phone}</span>
                        </div>
                      ))}
                      {(client.emails.length > 2 || client.phones.length > 2) && (
                        <span className="text-xs text-muted-foreground">
                          +{Math.max(0, client.emails.length - 2) + Math.max(0, client.phones.length - 2)} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(client.latestDate).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewJobs(client.name)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Jobs
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {organizationId && tenstreetSystem && (
                            <DropdownMenuItem 
                              onClick={() => handleQuickAddTenstreet(client.clientId, client.name)}
                            >
                              <Truck className="w-4 h-4 mr-2" />
                              Quick Add Tenstreet
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleEditClient(client.name)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClient(client.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    
    {/* Quick Add Tenstreet Dialog */}
    {organizationId && (
      <ATSConnectionDialog
        open={!!quickAddClient}
        onOpenChange={(open) => !open && setQuickAddClient(null)}
        organizationId={organizationId}
        clientId={quickAddClient?.id}
        clientName={quickAddClient?.name}
        connection={null}
        mode="create"
      />
    )}
    </>
  );
};

export default ClientsTable;