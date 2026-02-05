 import React, { useState, useMemo } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { SEO } from '@/components/SEO';
 import { ClientsHero, ClientsStats, ClientsGrid, type PublicClient } from '@/components/public/clients';
 
 const ClientsPage = () => {
   const [searchTerm, setSearchTerm] = useState('');
 
   const { data: clients, isLoading } = useQuery({
     queryKey: ['public-clients-grid'],
     queryFn: async () => {
       const { data, error } = await supabase
         .from('public_client_info')
         .select('id, name, logo_url, city, state, job_count')
         .order('name');
       
       if (error) throw error;
       return (data || []) as PublicClient[];
     },
   });
 
   const filteredClients = useMemo(() => {
     if (!clients) return [];
     if (!searchTerm) return clients;
     
     const search = searchTerm.toLowerCase();
     return clients.filter(client =>
       client.name.toLowerCase().includes(search) ||
       client.city?.toLowerCase().includes(search) ||
       client.state?.toLowerCase().includes(search)
     );
   }, [clients, searchTerm]);
 
   const totalJobs = useMemo(() => 
     clients?.reduce((sum, c) => sum + (c.job_count || 0), 0) || 0
   , [clients]);
 
   return (
     <>
        <SEO 
          title="Companies Hiring | Browse Employers"
          description="Explore companies actively hiring drivers and transportation professionals. Find your next employer and browse open positions."
          keywords="companies hiring, employers, trucking companies, driver jobs, transportation jobs"
          ogImage="https://ats.me/og-clients.png"
        />
       
       <div className="min-h-screen bg-background">
         <ClientsHero searchTerm={searchTerm} onSearchChange={setSearchTerm} />
         <ClientsStats totalCompanies={clients?.length || 0} totalJobs={totalJobs} />
         
         <section className="py-12">
           <div className="container mx-auto px-4">
             <ClientsGrid 
               clients={filteredClients} 
               isLoading={isLoading} 
               searchTerm={searchTerm} 
             />
           </div>
         </section>
       </div>
     </>
   );
 };
 
 export default ClientsPage;
