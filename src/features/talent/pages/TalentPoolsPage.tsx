import React, { useState } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Trash2, FolderOpen, ArrowRight } from 'lucide-react';
import { useTalentPools } from '../hooks/useTalentPools';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function TalentPoolsPage() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const { pools, isLoading, createPool, deletePool, isCreating, isDeleting } = useTalentPools();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');

  const handleCreatePool = async () => {
    if (!newPoolName.trim() || !organization?.id) return;
    
    await createPool({
      name: newPoolName.trim(),
      description: newPoolDescription.trim() || undefined,
      organizationId: organization.id,
    });
    
    setNewPoolName('');
    setNewPoolDescription('');
    setIsCreateOpen(false);
  };

  const handleDeletePool = async (poolId: string) => {
    await deletePool(poolId);
  };

  if (isLoading) {
    return (
      <PageLayout title="Talent Pools">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Talent Pools"
      description="Organize and manage your candidate pipeline"
    >
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/talent')}>
            <Users className="w-4 h-4 mr-2" />
            Search Candidates
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Pool
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Talent Pool</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="pool-name">Pool Name</Label>
                  <Input
                    id="pool-name"
                    placeholder="e.g., CDL-A Experienced Drivers"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pool-description">Description (optional)</Label>
                  <Textarea
                    id="pool-description"
                    placeholder="Describe the criteria or purpose of this pool"
                    value={newPoolDescription}
                    onChange={(e) => setNewPoolDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePool} disabled={!newPoolName.trim() || isCreating}>
                  {isCreating ? 'Creating...' : 'Create Pool'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pools Grid */}
        {pools.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No talent pools yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first talent pool to start organizing candidates
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Pool
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <Card key={pool.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{pool.name}</CardTitle>
                      {pool.description && (
                        <CardDescription className="line-clamp-2">
                          {pool.description}
                        </CardDescription>
                      )}
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Pool?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{pool.name}" and remove all candidates from this pool.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePool(pool.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {pool.member_count || 0} candidates
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/talent/pools/${pool.id}`)}
                    >
                      View
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
