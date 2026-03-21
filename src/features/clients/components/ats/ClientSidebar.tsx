import React from 'react';
import { Search, Plus, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { LogoAvatar } from '@/components/ui/logo-avatar';
import type { Client } from '../../types/client.types';
import type { ClientMetrics } from '../../hooks/useClientMetrics';

interface ClientSidebarProps {
  clients: Client[];
  clientMetrics: ClientMetrics[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onAddClient: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (f: string) => void;
}

const ClientSidebar: React.FC<ClientSidebarProps> = ({
  clients,
  clientMetrics,
  selectedClientId,
  onSelectClient,
  onAddClient,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const metricsMap = React.useMemo(() => {
    const map = new Map<string, ClientMetrics>();
    clientMetrics.forEach(m => map.set(m.id, m));
    return map;
  }, [clientMetrics]);

  const filtered = React.useMemo(() => {
    let result = clients;
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [clients, searchQuery, statusFilter]);

  const statusFilters = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="w-72 min-w-72 border-r bg-card flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => onStatusFilterChange(f.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No clients found
            </div>
          ) : (
            filtered.map(client => {
              const metrics = metricsMap.get(client.id);
              const isSelected = selectedClientId === client.id;
              const location = [client.city, client.state].filter(Boolean).join(', ');

              return (
                <button
                  key={client.id}
                  onClick={() => onSelectClient(client.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all group',
                    isSelected
                      ? 'bg-primary/10 border border-primary/30 shadow-sm'
                      : 'hover:bg-muted/50 border border-transparent'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <LogoAvatar
                      src={client.logo_url}
                      alt={client.name}
                      fallback={client.name.charAt(0)}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          'text-sm font-medium truncate',
                          isSelected && 'text-primary'
                        )}>
                          {client.name}
                        </span>
                        <span className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          client.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                        )} />
                      </div>
                      {location && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                          {metrics?.applicationCount ?? 0} apps
                        </Badge>
                        {(metrics?.recentApplications ?? 0) > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-amber-500 border-amber-500/30">
                            {metrics?.recentApplications} new
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Add Client Button */}
      <div className="p-3 border-t">
        <Button onClick={onAddClient} size="sm" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>
    </div>
  );
};

export default ClientSidebar;
