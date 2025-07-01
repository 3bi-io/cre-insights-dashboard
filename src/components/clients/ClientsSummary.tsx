
import React from 'react';
import { Users, Building, MapPin } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ClientsSummaryProps {
  clients: Client[];
}

const ClientsSummary = ({ clients }: ClientsSummaryProps) => {
  const activeClients = clients.filter(c => c.status === 'active').length;
  const uniqueCompanies = new Set(clients.filter(c => c.company).map(c => c.company)).size;
  const uniqueLocations = new Set(clients.filter(c => c.city).map(c => c.city)).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold text-foreground">{clients.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
            <p className="text-2xl font-bold text-foreground">{activeClients}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
            <Building className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Companies</p>
            <p className="text-2xl font-bold text-foreground">{uniqueCompanies}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Locations</p>
            <p className="text-2xl font-bold text-foreground">{uniqueLocations}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsSummary;
