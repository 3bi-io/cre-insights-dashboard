import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ApplicationsSearchProps {
  searchTerm: string;
  categoryFilter: string;
  sourceFilter: string;
  organizationFilter?: string;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onOrganizationChange?: (value: string) => void;
  showOrganizationFilter?: boolean;
  organizations?: Array<{ id: string; name: string; }>;
}

const ApplicationsSearch = ({
  searchTerm,
  categoryFilter,
  sourceFilter,
  organizationFilter = 'all',
  onSearchChange,
  onCategoryChange,
  onSourceChange,
  onOrganizationChange,
  showOrganizationFilter = false,
  organizations = [],
}: ApplicationsSearchProps) => {
  const isMobile = useIsMobile();

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4 mb-6`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by applicant name, email, or job title..."
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
      
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className={`${isMobile ? 'w-full h-12 text-base' : 'w-48'} bg-background border shadow-sm`}>
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover border shadow-md">
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="D">D - Experienced Driver</SelectItem>
          <SelectItem value="SC">SC - New CDL Holder</SelectItem>
          <SelectItem value="SR">SR - Student Ready</SelectItem>
          <SelectItem value="N/A">N/A - Uncategorized</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sourceFilter} onValueChange={onSourceChange}>
        <SelectTrigger className={`${isMobile ? 'w-full h-12 text-base' : 'w-48'} bg-background border shadow-sm`}>
          <SelectValue placeholder="Filter by source" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover border shadow-md">
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="fb">fb</SelectItem>
          <SelectItem value="ig">ig</SelectItem>
          <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ApplicationsSearch;