import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConnectionHealthBadge } from './ConnectionHealthBadge';
import { OrganizationCredentialStatus } from '@/services/tenstreetCredentialsService';
import { MoreVertical, Search, Settings, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TENSTREET_API_ENDPOINTS } from '@/types/tenstreet/api-contracts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CredentialsManagementTableProps {
  organizations: OrganizationCredentialStatus[];
  onConfigure: (organizationId: string) => void;
}

export function CredentialsManagementTable({
  organizations,
  onConfigure,
}: CredentialsManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'configured' | 'not_configured'>('all');

  // Filter organizations
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'configured' && org.credential_id) ||
      (filterStatus === 'not_configured' && !org.credential_id);

    return matchesSearch && matchesFilter;
  });

  const getModeColor = (mode: string | null) => {
    switch (mode) {
      case 'PROD':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'TEST':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'DEV':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'configured' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('configured')}
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Configured
          </Button>
          <Button
            variant={filterStatus === 'not_configured' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('not_configured')}
            size="sm"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Not Configured
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Connection</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>API Endpoint</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead className="text-right">Applications</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{org.name}</span>
                      <span className="text-xs text-muted-foreground">{org.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {org.credential_id ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <ConnectionHealthBadge
                      health={org.connection_health}
                      lastSyncTime={org.last_sync_time}
                    />
                  </TableCell>
                  <TableCell>
                    {org.mode ? (
                      <Badge variant="outline" className={getModeColor(org.mode)}>
                        {org.mode}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {org.api_endpoint ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                              {TENSTREET_API_ENDPOINTS.find(e => e.value === org.api_endpoint)?.label || org.api_endpoint}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">{org.api_endpoint}</p>
                              <p className="text-xs text-muted-foreground">
                                {TENSTREET_API_ENDPOINTS.find(e => e.value === org.api_endpoint)?.description}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {org.last_sync_time ? (
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(org.last_sync_time), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Never</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">{org.total_applications}</span>
                      <span className="text-xs text-muted-foreground">
                        {org.synced_count} synced
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onConfigure(org.id)}>
                          <Settings className="w-4 h-4 mr-2" />
                          {org.credential_id ? 'Edit Configuration' : 'Configure Credentials'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredOrgs.length} of {organizations.length} organizations
      </div>
    </div>
  );
}
