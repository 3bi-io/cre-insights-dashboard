import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
interface ClientsSearchProps {
  clientsCount: number;
}
const ClientsSearch = ({
  clientsCount
}: ClientsSearchProps) => {
  return <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search clients..." className="pl-10" />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        
      </div>
    </div>;
};
export default ClientsSearch;