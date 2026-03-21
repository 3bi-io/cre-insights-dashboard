import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { MapPin, Mail, Phone, Building, Eye, MoreHorizontal, Edit, Trash2, Truck, Globe } from 'lucide-react';
import { ATSConnectionDialog } from '@/features/ats/components/ATSConnectionDialog';
import { useATSSystems } from '@/hooks/useATSConnections';
import { ResponsiveTableWrapper, ResponsiveCardWrapper } from '@/components/ui/responsive-data-display';
import { CompanyLogo } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { GeoExpandDialog } from '@/components/admin/GeoExpandDialog';
import type { Client, ConsolidatedClient } from '../types/client.types';

interface ClientsTableProps {
  clients: Client[];
  organizationId?: string;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ 
  clients, 
  organizationId,
  onEditClient,
  onDeleteClient,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange
}) => {
  const navigate = useNavigate();
  const { data: atsSystems } = useATSSystems();
  const [quickAddClient, setQuickAddClient] = useState<{ id: string; name: string } | null>(null);
  const [geoExpandClientId, setGeoExpandClientId] = useState<string | null>(null);
  const { userRole } = useAuth();
  const tenstreetSystem = atsSystems?.find(s => s.slug === 'tenstreet');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'inactive': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const consolidatedClients = useMemo(() => {
    const clientMap = new Map<string, ConsolidatedClient & { clientId: string; logo_url: string | null }>();

    clients.forEach(client => {
      const key = client.name;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          name: client.name,
          clientId: client.id,
          logo_url: client.logo_url,
          locations: [],
          totalLocations: 0,
          status: client.status,
          latestDate: client.created_at,
          emails: [],
          phones: []
        });
      }

      const consolidated = clientMap.get(key)!;
      if (!consolidated.logo_url && client.logo_url) consolidated.logo_url = client.logo_url;
      
      if (client.city && client.state) {
        const location = `${client.city}, ${client.state}`;
        if (!consolidated.locations.includes(location)) consolidated.locations.push(location);
      }
      if (client.email && !consolidated.emails.includes(client.email)) consolidated.emails.push(client.email);
      if (client.phone && !consolidated.phones.includes(client.phone)) consolidated.phones.push(client.phone);
      if (new Date(client.created_at) > new Date(consolidated.latestDate)) consolidated.latestDate = client.created_at;
      consolidated.totalLocations++;
    });

    return Array.from(clientMap.values()).sort((a, b) => 
      new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [clients]);

  const handleViewJobs = (clientName: string) => {
    navigate(`/admin/jobs?client=${encodeURIComponent(clientName)}`);
  };

  const handleEditClient = (clientName: string) => {
    const clientToEdit = clients.find(c => c.name === clientName);
    if (clientToEdit && onEditClient) onEditClient(clientToEdit);
  };

  const handleDeleteClient = (clientName: string) => {
    const clientToDelete = clients.find(c => c.name === clientName);
    if (clientToDelete && onDeleteClient) onDeleteClient(clientToDelete.id);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
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

  const ClientCard = ({ client }: { client: typeof consolidatedClients[0] }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <CompanyLogo logoUrl={client.logo_url} companyName={client.name} size="md" />
            <div className="min-w-0">
              <h4 className="font-medium text-foreground">{client.name}</h4>
              {client.totalLocations > 1 && (
                <span className="text-sm text-muted-foreground">{client.totalLocations} locations</span>
              )}
            </div>
          </div>
          <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
        </div>
        
        {client.locations.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{client.locations[0]}</span>
            {client.locations.length > 1 && <span className="text-xs">+{client.locations.length - 1}</span>}
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
          {client.emails[0] && (
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{client.emails[0]}</span>
            </div>
          )}
          {client.phones[0] && (
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{client.phones[0]}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            {new Date(client.latestDate).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleViewJobs(client.name)} className="h-9 gap-2">
              <Eye className="w-4 h-4" />
              Jobs
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {organizationId && tenstreetSystem && (
                  <DropdownMenuItem onClick={() => setQuickAddClient({ id: client.clientId, name: client.name })}>
                    <Truck className="w-4 h-4 mr-2" />Quick Add Tenstreet
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleEditClient(client.name)}>
                  <Edit className="w-4 h-4 mr-2" />Edit
                </DropdownMenuItem>
                {userRole === 'super_admin' && (
                  <DropdownMenuItem onClick={() => setGeoExpandClientId(client.clientId)}>
                    <Globe className="w-4 h-4 mr-2" />Geo Expand All Jobs
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDeleteClient(client.name)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * 25) + 1}–{Math.min(currentPage * 25, totalItems)} of {totalItems}
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {getPageNumbers().map((page, i) => (
              <PaginationItem key={i}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => onPageChange?.(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Card View */}
      <ResponsiveCardWrapper className="space-y-3">
        {consolidatedClients.map((client) => (
          <ClientCard key={client.name} client={client} />
        ))}
        <PaginationControls />
      </ResponsiveCardWrapper>

      {/* Desktop Table View */}
      <ResponsiveTableWrapper>
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
                        <div className="flex items-center gap-3">
                          <CompanyLogo logoUrl={client.logo_url} companyName={client.name} size="sm" />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{client.name}</span>
                            {client.totalLocations > 1 && (
                              <span className="text-sm text-muted-foreground">{client.totalLocations} locations</span>
                            )}
                          </div>
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
                            <span className="text-xs text-muted-foreground ml-4">+{client.locations.length - 3} more</span>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(client.latestDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleViewJobs(client.name)} className="gap-2 h-9">
                            <Eye className="w-4 h-4" />View Jobs
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {organizationId && tenstreetSystem && (
                                <DropdownMenuItem onClick={() => setQuickAddClient({ id: client.clientId, name: client.name })}>
                                  <Truck className="w-4 h-4 mr-2" />Quick Add Tenstreet
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEditClient(client.name)}>
                                <Edit className="w-4 h-4 mr-2" />Edit Client
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClient(client.name)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />Delete Client
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
            <div className="px-4 pb-4">
              <PaginationControls />
            </div>
          </CardContent>
        </Card>
      </ResponsiveTableWrapper>
    
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

      {geoExpandClientId && (
        <GeoExpandDialog
          open={!!geoExpandClientId}
          onOpenChange={(open) => { if (!open) setGeoExpandClientId(null); }}
          clientId={geoExpandClientId}
        />
      )}
    </>
  );
};

export default ClientsTable;
