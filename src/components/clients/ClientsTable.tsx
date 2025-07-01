
import React from 'react';
import { Users, Mail, Phone, Building, MapPin, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ClientsTableProps {
  clients: Client[];
}

const ClientsTable = ({ clients }: ClientsTableProps) => {
  const getClientFromLocation = (city: string | null, state: string | null) => {
    if (!city || !state) return null;
    
    const location = `${city}, ${state}`;
    const locationClientMap: { [key: string]: string } = {
      'Joliet, IL': 'Dollar Tree',
      'Ridgefield, OR': 'Dollar Tree',
      'Cowpens, SC': 'Dollar Tree',
      'Warrensburg, MO': 'Dollar Tree',
      'Memphis, TN': 'Dollar Tree',
      'Oklahoma City, OK': 'Family Dollar',
      'St George, UT': 'Family Dollar',
      'Denver, CO': 'Kroger'
    };
    
    return locationClientMap[location] || null;
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Client Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-muted-foreground" />
                  <p className="text-muted-foreground">No clients found</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first client to get started
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => {
              const clientName = getClientFromLocation(client.city, client.state);
              
              return (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{client.name}</div>
                        {client.notes && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {client.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {client.email && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.company ? (
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground">{client.company}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {clientName ? (
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground font-medium">{clientName}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.city || client.state ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground">
                          {[client.city, client.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(client.status)}>
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border border-border">
                        <DropdownMenuItem>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Add Note</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
