import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Users, MapPin, Phone, Mail, Plus, FolderPlus, Filter, X } from 'lucide-react';
import { useCandidateSearch } from '../hooks/useCandidateSearch';
import { useTalentPools, useTalentPoolMembers } from '../hooks/useTalentPools';
import { useNavigate } from 'react-router-dom';
import { formatPhoneForDisplay } from '@/utils/phoneNormalizer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Application } from '@/types/common.types';

export default function TalentSearchPage() {
  const navigate = useNavigate();
  const { candidates, isLoading, filters, updateFilter, resetFilters } = useCandidateSearch();
  const { pools } = useTalentPools();
  
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [addToPoolOpen, setAddToPoolOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');

  const { addMember, isAdding } = useTalentPoolMembers(selectedPoolId);

  const handleAddToPool = async () => {
    if (!selectedCandidate || !selectedPoolId) return;
    
    await addMember({
      poolId: selectedPoolId,
      applicationId: selectedCandidate.id,
    });
    
    setAddToPoolOpen(false);
    setSelectedCandidate(null);
    setSelectedPoolId('');
  };

  const openAddToPoolDialog = (candidate: Application) => {
    setSelectedCandidate(candidate);
    setAddToPoolOpen(true);
  };

  const getApplicantName = (app: Application) => {
    if (app.first_name && app.last_name) return `${app.first_name} ${app.last_name}`;
    return app.first_name || app.last_name || 'Anonymous';
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <PageLayout 
      title="Candidate Search"
      description="Search and discover candidates across your talent database"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/talent/pools')}>
            <Users className="w-4 h-4 mr-2" />
            Manage Pools
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* State Filter */}
              <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any State</SelectItem>
                  {['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'].map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* CDL Filter */}
              <Select value={filters.cdl} onValueChange={(v) => updateFilter('cdl', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="CDL Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any CDL</SelectItem>
                  <SelectItem value="yes">Has CDL</SelectItem>
                  <SelectItem value="no">No CDL</SelectItem>
                  <SelectItem value="A">Class A</SelectItem>
                  <SelectItem value="B">Class B</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(v) => updateFilter('status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="interviewed">Interviewed</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* City Filter */}
              <Input
                placeholder="City..."
                value={filters.city}
                onChange={(e) => updateFilter('city', e.target.value)}
              />

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={resetFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more results'
                  : 'Start searching to find candidates'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Found {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {/* Name & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{getApplicantName(candidate)}</h4>
                        <p className="text-sm text-muted-foreground">
                          {candidate.job_listings?.title || 'No position'}
                        </p>
                      </div>
                      <Badge variant={candidate.status === 'hired' ? 'default' : 'secondary'}>
                        {candidate.status || 'pending'}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-sm">
                      {candidate.applicant_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{candidate.applicant_email}</span>
                        </div>
                      )}
                      {candidate.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{formatPhoneForDisplay(candidate.phone)}</span>
                        </div>
                      )}
                      {(candidate.city || candidate.state) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{[candidate.city, candidate.state].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {candidate.cdl && (
                        <Badge variant="outline" className="text-xs">CDL: {candidate.cdl}</Badge>
                      )}
                      {candidate.exp && (
                        <Badge variant="outline" className="text-xs">{candidate.exp} exp</Badge>
                      )}
                      {candidate.source && (
                        <Badge variant="outline" className="text-xs">{candidate.source}</Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAddToPoolDialog(candidate)}
                        disabled={pools.length === 0}
                      >
                        <FolderPlus className="w-4 h-4 mr-1" />
                        Add to Pool
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add to Pool Dialog */}
      <Dialog open={addToPoolOpen} onOpenChange={setAddToPoolOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Talent Pool</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedCandidate && (
              <p className="text-sm text-muted-foreground mb-4">
                Adding <strong>{getApplicantName(selectedCandidate)}</strong> to a talent pool
              </p>
            )}
            <div className="space-y-2">
              <Label>Select Pool</Label>
              <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pool..." />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((pool) => (
                    <SelectItem key={pool.id} value={pool.id}>
                      {pool.name} ({pool.member_count || 0} members)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddToPoolOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToPool} disabled={!selectedPoolId || isAdding}>
              {isAdding ? 'Adding...' : 'Add to Pool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
