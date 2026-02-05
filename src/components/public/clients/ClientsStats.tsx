 import React from 'react';
 
 interface ClientsStatsProps {
   totalCompanies: number;
   totalJobs: number;
 }
 
 export const ClientsStats: React.FC<ClientsStatsProps> = ({ totalCompanies, totalJobs }) => {
   return (
     <section className="border-b border-border bg-muted/30">
       <div className="container mx-auto px-4 py-6">
         <div className="flex flex-wrap justify-center gap-8 text-center">
           <div>
             <p className="text-2xl md:text-3xl font-bold text-primary">
               {totalCompanies}
             </p>
             <p className="text-sm text-muted-foreground">Active Companies</p>
           </div>
           <div>
             <p className="text-2xl md:text-3xl font-bold text-primary">
               {totalJobs}
             </p>
             <p className="text-sm text-muted-foreground">Open Positions</p>
           </div>
         </div>
       </div>
     </section>
   );
 };