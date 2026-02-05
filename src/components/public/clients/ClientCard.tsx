 import React from 'react';
 import { Link } from 'react-router-dom';
 import { Card, CardContent } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { LogoAvatar, LogoAvatarImage, LogoAvatarFallback } from '@/components/ui/logo-avatar';
 import { MapPin, Briefcase } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 export interface PublicClient {
   id: string;
   name: string;
   logo_url: string | null;
   city: string | null;
   state: string | null;
   job_count: number;
 }
 
 interface ClientCardProps {
   client: PublicClient;
 }
 
 export const ClientCard: React.FC<ClientCardProps> = ({ client }) => {
   const location = [client.city, client.state].filter(Boolean).join(', ');
   
   return (
     <Link to={`/jobs?client=${client.id}`}>
       <Card className={cn(
         "group overflow-hidden transition-all duration-200",
         "hover:shadow-lg hover:border-primary/50 hover:-translate-y-1",
         "cursor-pointer h-full"
       )}>
         <CardContent className="p-4 flex flex-col items-center text-center">
           <LogoAvatar size="lg" className="w-full aspect-square mb-3">
             {client.logo_url ? (
               <LogoAvatarImage 
                 src={client.logo_url}
                 alt={`${client.name} logo`}
                 loading="lazy"
                 className="group-hover:scale-105 transition-transform duration-200"
               />
             ) : (
               <LogoAvatarFallback iconSize="lg" />
             )}
           </LogoAvatar>
           
           <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
             {client.name}
           </h3>
           
           {location && (
             <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
               <MapPin className="h-3 w-3 flex-shrink-0" />
               <span className="truncate">{location}</span>
             </div>
           )}
           
           {client.job_count > 0 && (
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