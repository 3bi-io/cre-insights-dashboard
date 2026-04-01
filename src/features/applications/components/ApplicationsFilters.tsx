import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFilterSheet, FilterSection } from '@/components/ui/mobile-filter-sheet';
import type { Organization } from '@/types/common.types';

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
  sourceOptions?: string[];
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
}: ApplicationsFiltersProps) => {
  const isMobile = useIsMobile();

  // Count active filters for mobile badge
  const activeFilterCount = [
    statusFilter !== 'all',
    categoryFilter !== 'all',
    sourceFilter !== 'all',
    showOrganizationFilter && organizationFilter && organizationFilter !== 'all',
    showClientFilter && clientFilter && clientFilter !== 'all',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onStatusChange('all');
    onCategoryChange('all');
    onSourceChange('all');
    if (onOrganizationChange) onOrganizationChange('all');
    if (onClientChange) onClientChange('all');
  };

  // Filter content - reused for both mobile and desktop
  const FilterContent = () => (
    <>
      <FilterSection label="Status">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="interviewing">Interviewing</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection label="Category">
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="A">Class A (CDL + Exp)</SelectItem>
            <SelectItem value="B">Class B (CDL, No Exp)</SelectItem>
            <SelectItem value="C">Class C (No CDL)</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection label="Source">
        <Select value={sourceFilter} onValueChange={onSourceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Meta">Meta</SelectItem>
            <SelectItem value="Indeed">Indeed</SelectItem>
            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
            <SelectItem value="Direct">Direct Apply</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      {showOrganizationFilter && organizationFilter && onOrganizationChange && (
        <FilterSection label="Organization">
          <Select value={organizationFilter} onValueChange={onOrganizationChange}>
            <SelectTrigger className="w-full">
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
        </FilterSection>
      )}

      {showClientFilter && clientFilter && onClientChange && (
        <FilterSection label="Client">
          <Select value={clientFilter} onValueChange={onClientChange}>
            <SelectTrigger className="w-full">
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
        </FilterSection>
      )}
    </>
  );

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Search - Always visible */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Mobile: Filter button */}
          {isMobile && (
            <MobileFilterSheet
              activeFilterCount={activeFilterCount}
              onClearFilters={handleClearFilters}
            >
              <FilterContent />
            </MobileFilterSheet>
          )}
        </div>

        {/* Desktop: Inline filters */}
        {!isMobile && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
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
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Meta">Meta</SelectItem>
                <SelectItem value="Indeed">Indeed</SelectItem>
                <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                <SelectItem value="Direct">Direct Apply</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
              </SelectContent>
            </Select>

            {showOrganizationFilter && organizationFilter && onOrganizationChange && (
              <Select value={organizationFilter} onValueChange={onOrganizationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Organization" />
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
            )}

            {showClientFilter && clientFilter && onClientChange && (
              <Select value={clientFilter} onValueChange={onClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Client" />
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
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
