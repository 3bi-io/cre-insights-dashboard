import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Mail, TrendingUp } from 'lucide-react';
import type { Client } from '../types/client.types';

interface ClientsSummaryProps {
  clients: Client[];
}

const ClientsSummary: React.FC<ClientsSummaryProps> = ({ clients }) => {
  const stats = useMemo(() => {
    // Consolidate clients by name to avoid counting duplicates
    const consolidatedClients = clients.reduce((acc, client) => {
      const existing = acc.find(c => c.name === client.name);
      if (!existing) {
        acc.push(client);
      }
      return acc;
    }, [] as Client[]);

    const totalClients = consolidatedClients.length;
    const activeClients = consolidatedClients.filter(c => c.status === 'active').length;
    const uniqueLocations = new Set<string>();
    const uniqueEmails = new Set<string>();

    clients.forEach(client => {
      if (client.city && client.state) {
        uniqueLocations.add(`${client.city}, ${client.state}`);
      }
      if (client.email) {
        uniqueEmails.add(client.email);
      }
    });

    const recentClients = consolidatedClients.filter(client => {
      const clientDate = new Date(client.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return clientDate >= thirtyDaysAgo;
    }).length;

    return {
      totalClients,
      activeClients,
      uniqueLocations: uniqueLocations.size,
      uniqueEmails: uniqueEmails.size,
      recentClients,
      inactiveClients: totalClients - activeClients,
    };
  }, [clients]);

  if (clients.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{stats.activeClients} Active</Badge>
            {stats.inactiveClients > 0 && (
              <Badge variant="outline">{stats.inactiveClients} Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueLocations}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Unique cities & states
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contact Points</CardTitle>
          <Mail className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueEmails}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Unique email addresses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentClients}</div>
          <p className="text-xs text-muted-foreground mt-2">
            New clients (30 days)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsSummary;