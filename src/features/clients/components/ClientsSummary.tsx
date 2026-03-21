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
    const consolidatedClients = clients.reduce((acc, client) => {
      if (!acc.find(c => c.name === client.name)) acc.push(client);
      return acc;
    }, [] as Client[]);

    const totalClients = consolidatedClients.length;
    const activeClients = consolidatedClients.filter(c => c.status === 'active').length;
    const uniqueLocations = new Set<string>();
    const uniqueEmails = new Set<string>();

    clients.forEach(client => {
      if (client.city && client.state) uniqueLocations.add(`${client.city}, ${client.state}`);
      if (client.email) uniqueEmails.add(client.email);
    });

    const recentClients = consolidatedClients.filter(client => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(client.created_at) >= thirtyDaysAgo;
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

  if (clients.length === 0) return null;

  const cards = [
    {
      title: 'Total Clients',
      icon: Building2,
      value: stats.totalClients,
      extra: (
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{stats.activeClients} Active</Badge>
          {stats.inactiveClients > 0 && <Badge variant="outline">{stats.inactiveClients} Inactive</Badge>}
        </div>
      ),
    },
    {
      title: 'Locations',
      icon: MapPin,
      value: stats.uniqueLocations,
      subtitle: 'Unique cities & states',
    },
    {
      title: 'Contact Points',
      icon: Mail,
      value: stats.uniqueEmails,
      subtitle: 'Unique email addresses',
    },
    {
      title: 'Recent Activity',
      icon: TrendingUp,
      value: stats.recentClients,
      subtitle: 'New clients (30 days)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.extra || (
              <p className="text-xs text-muted-foreground mt-2">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientsSummary;
