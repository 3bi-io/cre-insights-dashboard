import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AdminPageLayout from '@/features/shared/components/AdminPageLayout';
import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Search, ClipboardList } from 'lucide-react';

const ActiveJobIds: React.FC = () => {
  const { userRole, organization } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'super_admin';

  // Fetch active jobs
  const { data: activeJobs, isLoading } = useQuery({
    queryKey: ['active-jobs-list', isSuperAdmin ? 'all' : organization?.id],
    queryFn: async () => {
      let query = supabase
        .from('job_listings')
        .select('id, title, job_title, organization_id, organizations:organization_id(name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!isSuperAdmin && organization?.id) {
        query = query.eq('organization_id', organization.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin || !!organization?.id,
  });

  // Fetch organizations for filter (super admin only)
  const { data: organizations } = useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  // Filter jobs
  const filteredJobs = activeJobs?.filter(job => {
    const matchesSearch = !searchTerm || 
      (job.title || job.job_title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOrg = organizationFilter === 'all' || job.organization_id === organizationFilter;
    
    return matchesSearch && matchesOrg;
  }) || [];

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const copyToClipboard = async (text: string, id: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    toast({
      title: 'Copied!',
      description: `${type} copied to clipboard`,
    });
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const copyAllJobIds = async () => {
    const ids = filteredJobs.map(job => job.id).join('\n');
    await navigator.clipboard.writeText(ids);
    toast({
      title: 'All Job IDs Copied!',
      description: `${filteredJobs.length} job IDs copied to clipboard`,
    });
  };

  const copyAllXLinks = async () => {
    const baseUrl = getBaseUrl();
    const links = filteredJobs.map(job => `${baseUrl}/x/apply/${job.id}`).join('\n');
    await navigator.clipboard.writeText(links);
    toast({
      title: 'All X Links Copied!',
      description: `${filteredJobs.length} X apply links copied to clipboard`,
    });
  };

  const copyAllStandardLinks = async () => {
    const baseUrl = getBaseUrl();
    const links = filteredJobs.map(job => `${baseUrl}/apply?job_id=${job.id}`).join('\n');
    await navigator.clipboard.writeText(links);
    toast({
      title: 'All Standard Links Copied!',
      description: `${filteredJobs.length} standard apply links copied to clipboard`,
    });
  };

  const isCopied = (id: string, type: string) => copiedId === id && copiedType === type;

  return (
    <AdminPageLayout
      title="Active Job IDs"
      description="Quick access to all active job IDs and apply links for easy copying"
      isLoading={isLoading}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyAllJobIds}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Copy All IDs
          </Button>
          <Button variant="outline" size="sm" onClick={copyAllXLinks}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All X Links
          </Button>
          <Button variant="outline" size="sm" onClick={copyAllStandardLinks}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All Standard Links
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {isSuperAdmin && (
            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="text-sm text-muted-foreground">
            {filteredJobs.length} active jobs
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                {isSuperAdmin && <TableHead>Organization</TableHead>}
                <TableHead>Job ID</TableHead>
                <TableHead>X Apply Link</TableHead>
                <TableHead>Standard Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const baseUrl = getBaseUrl();
                const xLink = `${baseUrl}/x/apply/${job.id}`;
                const standardLink = `${baseUrl}/apply?job_id=${job.id}`;
                const orgName = (job.organizations as { name: string } | null)?.name;

                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      {job.title || job.job_title || 'Untitled'}
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell className="text-muted-foreground">
                        {orgName || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {job.id.slice(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(job.id, job.id, 'Job ID')}
                        >
                          {isCopied(job.id, 'Job ID') ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[200px]">
                          /x/apply/{job.id.slice(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(xLink, job.id, 'X Link')}
                        >
                          {isCopied(job.id, 'X Link') ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[200px]">
                          /apply?job_id={job.id.slice(0, 8)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(standardLink, job.id, 'Standard Link')}
                        >
                          {isCopied(job.id, 'Standard Link') ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredJobs.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center py-8 text-muted-foreground">
                    No active jobs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default ActiveJobIds;
