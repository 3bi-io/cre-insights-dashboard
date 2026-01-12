import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, MapPin, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PublicClient {
  id: string;
  name: string;
  company: string | null;
  logo_url: string | null;
  city: string | null;
  state: string | null;
  status: string;
  organization_id: string | null;
  job_count?: number;
}

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all active clients with job counts
  const { data: clients, isLoading } = useQuery({
    queryKey: ['public-clients-grid'],
    queryFn: async () => {
      // Get the ACME organization ID to exclude (demo data)
      const { data: acmeOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', 'acme')
        .single();
      
      const acmeOrgId = acmeOrg?.id;
      
      // Fetch active clients
      let query = supabase
        .from('clients')
        .select('id, name, company, logo_url, city, state, status, organization_id')
        .eq('status', 'active')
        .order('name');
      
      if (acmeOrgId) {
        query = query.neq('organization_id', acmeOrgId);
      }
      
      const { data: clientsData, error } = await query;
      
      if (error) throw error;
      
      // Get job counts for each client
      const clientIds = clientsData?.map(c => c.id) || [];
      const { data: jobCounts } = await supabase
        .from('job_listings')
        .select('client_id')
        .eq('status', 'active')
        .in('client_id', clientIds);
      
      // Count jobs per client
      const jobCountMap: Record<string, number> = {};
      jobCounts?.forEach(job => {
        if (job.client_id) {
          jobCountMap[job.client_id] = (jobCountMap[job.client_id] || 0) + 1;
        }
      });
      
      // Add job counts to clients and filter to only those with jobs
      const clientsWithJobs = clientsData
        ?.map(client => ({
          ...client,
          job_count: jobCountMap[client.id] || 0
        }))
        .filter(client => client.job_count > 0) || [];
      
      return clientsWithJobs as PublicClient[];
    },
  });

  // Filter clients based on search
  const filteredClients = React.useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    
    const search = searchTerm.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(search) ||
      client.company?.toLowerCase().includes(search) ||
      client.city?.toLowerCase().includes(search) ||
      client.state?.toLowerCase().includes(search)
    );
  }, [clients, searchTerm]);

  return (
    <>
      <SEO 
        title="Companies Hiring | Browse Employers"
        description="Explore companies actively hiring drivers and transportation professionals. Find your next employer and browse open positions."
        keywords="companies hiring, employers, trucking companies, driver jobs, transportation jobs"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Companies Hiring Now
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Browse top employers in the transportation industry and discover your next career opportunity
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search companies by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base bg-background border-border"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {clients?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Companies</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {clients?.reduce((sum, c) => sum + (c.job_count || 0), 0) || 0}
                </p>
                <p className="text-sm text-muted-foreground">Open Positions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Clients Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4">
                      <Skeleton className="aspect-square w-full rounded-lg mb-3" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchTerm ? 'No companies found' : 'No companies available'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Check back soon for new employers'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    Showing <span className="font-medium text-foreground">{filteredClients.length}</span> companies
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                  {filteredClients.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

interface ClientCardProps {
  client: PublicClient;
}

const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
  const location = [client.city, client.state].filter(Boolean).join(', ');
  
  return (
    <Link to={`/jobs?client=${client.id}`}>
      <Card className={cn(
        "group overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
        "cursor-pointer h-full"
      )}>
        <CardContent className="p-4 flex flex-col items-center text-center">
          {/* Logo Container */}
          <div className="w-full aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            {client.logo_url ? (
              <img
                src={client.logo_url}
                alt={`${client.name} logo`}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground/40" />
            )}
          </div>
          
          {/* Company Name */}
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {client.name}
          </h3>
          
          {/* Location */}
          {location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          
          {/* Job Count Badge */}
          {client.job_count && client.job_count > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Briefcase className="h-3 w-3 mr-1" />
              {client.job_count} {client.job_count === 1 ? 'job' : 'jobs'}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ClientsPage;
