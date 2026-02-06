 import React, { useState, useMemo } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { SEO } from '@/components/SEO';
 import { ClientsHero, ClientsGrid, type PublicClient } from '@/components/public/clients';
 import { Input } from '@/components/ui/input';
 import { Search } from 'lucide-react';
 
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
 
  return (
    <>
      <SEO 
        title="Companies Hiring | Browse Employers"
        description="Explore companies actively hiring drivers and transportation professionals. Find your next employer and browse open positions."
        keywords="companies hiring, employers, trucking companies, driver jobs, transportation jobs"
        ogImage="https://ats.me/og-clients.png"
      />
       
       <div className="min-h-screen bg-background">
         <ClientsHero totalCompanies={clients?.length || 0} />
         
         <section className="py-12">
           <div className="container mx-auto px-4">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <p className="text-muted-foreground">
                 Showing <span className="font-medium text-foreground">{filteredClients.length}</span> companies
               </p>
               <div className="relative max-w-sm w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input
                   type="text"
                   placeholder="Search companies..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-9 h-10 text-sm bg-background border-border"
                 />
               </div>
             </div>
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
