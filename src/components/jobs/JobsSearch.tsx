
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface JobsSearchProps {
  searchTerm: string;
  organizationFilter?: string;
  onSearchChange: (value: string) => void;
  onOrganizationChange?: (value: string) => void;
  showOrganizationFilter?: boolean;
  organizations?: Array<{ id: string; name: string; }>;
}

const JobsSearch: React.FC<JobsSearchProps> = ({
  searchTerm,
  organizationFilter = 'all',
  onSearchChange,
  onOrganizationChange,
  showOrganizationFilter = false,
  organizations = [],
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 mb-6`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search jobs by title, location, platform..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`pl-10 ${isMobile ? 'h-12 text-base' : ''}`}
        />
      </div>
      
      {/* Organization Filter for Super Admins */}
      {showOrganizationFilter && (
        <Select value={organizationFilter} onValueChange={onOrganizationChange}>
          <SelectTrigger className={`${isMobile ? 'w-full h-12 text-base' : 'w-56'} bg-background border shadow-sm`}>
            <SelectValue placeholder="Filter by organization" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-popover border shadow-md">
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default JobsSearch;
