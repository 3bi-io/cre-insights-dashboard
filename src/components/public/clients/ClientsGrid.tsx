 import React from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Building2 } from 'lucide-react';
 import { ClientCard, type PublicClient } from './ClientCard';
 
 interface ClientsGridProps {
   clients: PublicClient[];
   isLoading: boolean;
   searchTerm: string;
 }
 
 export const ClientsGrid: React.FC<ClientsGridProps> = ({ clients, isLoading, searchTerm }) => {
   if (isLoading) {
     return (
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
     );
   }
 
   if (clients.length === 0) {
     return (
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
     );
   }
 
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    );
  };