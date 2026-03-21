/**
 * Clients/Employers Page
 * Industry filters, featured employers, and partner CTA
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { StructuredData } from '@/components/StructuredData';
import { buildBreadcrumbSchema } from '@/utils/breadcrumbSchema';
import { SITE_URL } from '@/config/siteConfig';
import { ClientsHero, ClientsGrid, type PublicClient } from '@/components/public/clients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Star, Building2 } from 'lucide-react';
import { GradientCTA, FilterBar } from '@/components/shared';
import { motion } from 'framer-motion';

const industryTabs = [
  { id: 'All', label: 'All' },
  { id: 'Transportation', label: 'Transportation' },
  { id: 'Healthcare', label: 'Healthcare' },
  { id: 'Cyber', label: 'Cyber' },
  { id: 'Trades', label: 'Trades' },
];

const ClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const { data: clients, isLoading } = useQuery({
    queryKey: ['public-clients-grid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_client_info')
        .select('id, name, logo_url, city, state, job_count, industry_vertical')
        .order('name');
      if (error) throw error;
      return (data || []) as PublicClient[];
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    let result = clients;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(search) || c.city?.toLowerCase().includes(search) || c.state?.toLowerCase().includes(search));
    }
    if (activeTab !== 'All') {
      const tabLower = activeTab.toLowerCase();
      result = result.filter(c => c.industry_vertical?.toLowerCase() === tabLower);
    }
    return result;
  }, [clients, searchTerm, activeTab]);

  const featuredEmployers = useMemo(() => {
    if (!clients) return [];
    return [...clients].filter(c => (c.job_count || 0) > 0 && c.logo_url).sort((a, b) => (b.job_count || 0) - (a.job_count || 0)).slice(0, 4);
  }, [clients]);

  const breadcrumbs = useMemo(() => buildBreadcrumbSchema([
    { name: 'Home', href: '/' },
    { name: 'Companies Hiring', href: '/clients' },
  ]), []);

  const collectionSchema = useMemo(() => {
    if (!clients || clients.length === 0) return null;
    return {
      "@context": "https://schema.org", "@type": "CollectionPage",
      "name": "Companies Hiring | Apply AI",
      "description": "Explore companies actively hiring. Find your next employer and browse open positions.",
      "url": `${SITE_URL}/clients`,
      "mainEntity": {
        "@type": "ItemList", "numberOfItems": clients.length,
        "itemListElement": clients.slice(0, 50).map((c, i) => ({
          "@type": "ListItem", "position": i + 1, "name": c.name, ...(c.logo_url && { "image": c.logo_url }),
        })),
      },
    };
  }, [clients]);

  return (
    <>
      <SEO title="Companies Hiring | Browse Employers" description="Explore companies actively hiring. Find your next employer and browse open positions." keywords="companies hiring, employers, trucking companies, driver jobs, transportation jobs" canonical={`${SITE_URL}/clients`} ogImage="https://applyai.jobs/og-clients.png" />
      <StructuredData data={[breadcrumbs, ...(collectionSchema ? [collectionSchema] : [])]} />
       
      <div className="min-h-screen bg-background">
        <ClientsHero totalCompanies={clients?.length || 0} />

        {/* Featured Employers */}
        {featuredEmployers.length > 0 && (
          <section className="py-8 md:py-12 bg-muted/30 border-b">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-accent fill-accent" />
                <h2 className="text-lg font-bold text-foreground">Featured Employers</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {featuredEmployers.map((client, i) => (
                  <motion.div key={client.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="hover:shadow-md hover:border-primary/30 transition-all duration-200">
                      <CardContent className="p-4 flex items-center gap-4">
                        {client.logo_url ? (
                          <img src={client.logo_url} alt={client.name} className="w-12 h-12 rounded-lg object-contain bg-muted p-1 flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{client.name}</p>
                          {client.city && client.state && <p className="text-xs text-muted-foreground truncate">{client.city}, {client.state}</p>}
                          <Badge variant="secondary" className="text-xs mt-1">{client.job_count} {client.job_count === 1 ? 'job' : 'jobs'}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}
        
        <section className="py-12">
          <div className="container mx-auto px-4">
            {/* Industry Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {industryTabs.map(tab => (
                  <Button key={tab.id} variant={activeTab === tab.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab(tab.id)} className="min-h-[36px] whitespace-nowrap">
                    {tab.label}
                  </Button>
                ))}
                <span className="text-sm text-muted-foreground whitespace-nowrap ml-2">{filteredClients.length} companies</span>
              </div>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="text" placeholder="Search companies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-10 text-sm bg-background border-border" />
              </div>
            </div>
            <ClientsGrid clients={filteredClients} isLoading={false} searchTerm={searchTerm} />
          </div>
        </section>

        <GradientCTA
          title="Become a Hiring Partner"
          description="Join our network and reach thousands of qualified candidates with AI-powered recruitment."
          primaryAction={{ label: 'Get Started', to: '/contact' }}
        />
      </div>
    </>
  );
};

export default ClientsPage;
