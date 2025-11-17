import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import type { Organization } from '@/types/common.types';
import type { WebhookOption } from '@/hooks/useWebhookOptions';

interface ApplicationsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  organizationFilter?: string;
  onOrganizationChange?: (value: string) => void;
  organizations?: Organization[];
  showOrganizationFilter?: boolean;
  clientFilter?: string;
  onClientChange?: (value: string) => void;
  clients?: Array<{ id: string; name: string; company?: string | null }>;
  showClientFilter?: boolean;
  webhookFilter?: string;
  onWebhookChange?: (value: string) => void;
  webhookOptions?: WebhookOption[];
  showWebhookFilter?: boolean;
}

export const ApplicationsFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  sourceFilter,
  onSourceChange,
  organizationFilter,
  onOrganizationChange,
  organizations = [],
  showOrganizationFilter = false,
  clientFilter,
  onClientChange,
  clients = [],
  showClientFilter = false,
  webhookFilter,
  onWebhookChange,
  webhookOptions = [],
  showWebhookFilter = false,
}: ApplicationsFiltersProps) => {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="A">Class A (CDL + Exp)</SelectItem>
            <SelectItem value="B">Class B (CDL, No Exp)</SelectItem>
            <SelectItem value="C">Class C (No CDL)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={onSourceChange}>
          <SelectTrigger>
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover border shadow-md">
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Direct Application">Direct Application</SelectItem>
            <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
            <SelectItem value="Facebook Lead Gen">Facebook Lead Gen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showOrganizationFilter && organizationFilter && onOrganizationChange && (
        <div className="mt-4">
          <Select value={organizationFilter} onValueChange={onOrganizationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showClientFilter && clientFilter && onClientChange && (
        <div className="mt-4">
          <Select value={clientFilter} onValueChange={onClientChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.company || client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showWebhookFilter && webhookFilter && onWebhookChange && (
        <div className="mt-4">
          <Select value={webhookFilter} onValueChange={onWebhookChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Webhook Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Webhook Sources</SelectItem>
              {webhookOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label} ({option.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </Card>
  );
};
