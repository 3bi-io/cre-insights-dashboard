import React, { useState } from 'react';
import { PageLayout } from '@/features/shared';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building2, BarChart3, Search, ArrowLeft } from 'lucide-react';
import { ClientPortalDashboard } from '@/features/dashboard/components/ClientPortalDashboard';

interface ClientSummary {
  id: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  status: string;
}

const ClientDashboardsPage: React.FC = () => {
  const { userRole, organization } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isSuperAdmin = userRole === 'super_admin';

  const { data: clients, isLoading } = useQuery({
    queryKey: ['admin-client-dashboards', organization?.id, isSuperAdmin],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('id, name, logo_url, city, state, status')
        .order('name');

      if (!isSuperAdmin && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ClientSummary[];
    },
  });

  const filteredClients = clients?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.state?.toLowerCase().includes(search.toLowerCase())
  );

  // If a client is selected, show their dashboard with a back button
  if (selectedClientId) {
    const client = clients?.find(c => c.id === selectedClientId);
    return (
      <PageLayout>
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedClientId(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Client List
          </Button>
          <ClientPortalDashboard overrideClientId={selectedClientId} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Client Dashboards</h1>
            <p className="text-sm text-muted-foreground">
              View analytics dashboards as each client sees them
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !filteredClients?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {search ? 'No clients match your search.' : 'No clients found.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedClientId(client.id)}
              >
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  {client.logo_url ? (
                    <img
                      src={client.logo_url}
                      alt={client.name}
                      className="h-10 w-10 rounded-lg object-contain border bg-background"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{client.name}</CardTitle>
                    {client.city && client.state && (
                      <p className="text-xs text-muted-foreground">{client.city}, {client.state}</p>
                    )}
                  </div>
                  <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="capitalize text-xs">
                    {client.status}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" size="sm" className="w-full gap-2 group-hover:bg-primary/5">
                    <BarChart3 className="w-4 h-4" />
                    View Dashboard
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ClientDashboardsPage;
