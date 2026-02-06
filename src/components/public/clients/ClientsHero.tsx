 import React from 'react';
 import { Input } from '@/components/ui/input';
 import { Search } from 'lucide-react';
 
 interface ClientsHeroProps {
   searchTerm: string;
   onSearchChange: (value: string) => void;
 }
 
 export const ClientsHero: React.FC<ClientsHeroProps> = ({ searchTerm, onSearchChange }) => {
   return (
     <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-20">
       <div className="container mx-auto px-4">
         <div className="text-center max-w-3xl mx-auto">
           <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
             Companies Hiring Now
           </h1>
           <p className="text-lg text-muted-foreground mb-8">
             Browse top employers in the transportation industry and discover your next career opportunity
           </p>
           
           <div className="relative max-w-xl mx-auto">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input
               type="text"
               placeholder="Search companies by name or location..."
               value={searchTerm}
               onChange={(e) => onSearchChange(e.target.value)}
               className="pl-12 h-12 text-base bg-background border-border"
             />
           </div>
         </div>
       </div>
     </section>
   );
 };