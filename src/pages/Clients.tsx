
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Search, Filter, MoreVertical, Mail, Phone, Building, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

const Clients = () => {
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

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      return data || [];
    },
  });

  const getStatusBadgeColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border shadow-sm">
          <div className="container mx-auto px-8 py-6 max-w-7xl">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Clients
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Manage your client relationships and contact information
              </p>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-8 py-8 max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-8 py-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Clients
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Manage your client relationships and contact information
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="default" className="flex items-center gap-2 h-10">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
              <Button className="flex items-center gap-2 h-10">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Client</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-8 max-w-7xl">
        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search clients..." 
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {clients?.length || 0} total clients
            </Badge>
          </div>
        </div>

        {/* Clients Table */}
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
              {clients?.length === 0 ? (
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
                clients?.map((client) => {
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold text-foreground">{clients?.length || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold text-foreground">
                  {clients?.filter(c => c.status === 'active').length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                <Building className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Companies</p>
                <p className="text-2xl font-bold text-foreground">
                  {clients ? new Set(clients.filter(c => c.company).map(c => c.company)).size : 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Locations</p>
                <p className="text-2xl font-bold text-foreground">
                  {clients ? new Set(clients.filter(c => c.city).map(c => c.city)).size : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Clients;
