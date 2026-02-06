import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Sparkles, Crown, Leaf, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

type SponsorshipTier = 'premium' | 'standard' | 'organic';

interface CampaignMapping {
  id: string;
  jobreferrer: string;
  tier: SponsorshipTier;
  label: string | null;
  description: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MappingFormData {
  jobreferrer: string;
  tier: SponsorshipTier;
  label: string;
  description: string;
}

const tierConfig: Record<SponsorshipTier, { label: string; icon: React.ReactNode; color: string }> = {
  premium: { 
    label: 'Premium', 
    icon: <Crown className="w-3 h-3" />, 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/30' 
  },
  standard: { 
    label: 'Standard', 
    icon: <Sparkles className="w-3 h-3" />, 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' 
  },
  organic: { 
    label: 'Organic', 
    icon: <Leaf className="w-3 h-3" />, 
    color: 'bg-green-500/10 text-green-600 border-green-500/30' 
  },
};

const CampaignMappingManager: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CampaignMapping | null>(null);
  const [formData, setFormData] = useState<MappingFormData>({
    jobreferrer: '',
    tier: 'organic',
    label: '',
    description: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mappings, isLoading, refetch } = useQuery({
    queryKey: ['campaign-sponsorship-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_sponsorship_mappings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CampaignMapping[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MappingFormData) => {
      const { error } = await supabase
        .from('campaign_sponsorship_mappings')
        .insert({
          jobreferrer: data.jobreferrer,
          tier: data.tier,
          label: data.label || null,
          description: data.description || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-sponsorship-mappings'] });
      toast({ title: 'Mapping created successfully' });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create mapping', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MappingFormData }) => {
      const { error } = await supabase
        .from('campaign_sponsorship_mappings')
        .update({
          jobreferrer: data.jobreferrer,
          tier: data.tier,
          label: data.label || null,
          description: data.description || null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-sponsorship-mappings'] });
      toast({ title: 'Mapping updated successfully' });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update mapping', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('campaign_sponsorship_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign-sponsorship-mappings'] });
      toast({ title: 'Mapping deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete mapping', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMapping(null);
    setFormData({ jobreferrer: '', tier: 'organic', label: '', description: '' });
  };

  const handleEdit = (mapping: CampaignMapping) => {
    setEditingMapping(mapping);
    setFormData({
      jobreferrer: mapping.jobreferrer,
      tier: mapping.tier,
      label: mapping.label || '',
      description: mapping.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobreferrer.trim()) {
      toast({ title: 'Job referrer is required', variant: 'destructive' });
      return;
    }

    if (editingMapping) {
      updateMutation.mutate({ id: editingMapping.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const TierBadge = ({ tier }: { tier: SponsorshipTier }) => {
    const config = tierConfig[tier];
    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Campaign Sponsorship Mappings
            </CardTitle>
            <CardDescription>
              Link jobreferrer values from CDL Job Cast feed to sponsorship tiers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setEditingMapping(null)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Mapping
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
                  </DialogTitle>
                  <DialogDescription>
                    Map a jobreferrer value to a sponsorship tier for campaign tracking
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobreferrer">Job Referrer ID *</Label>
                      <Input
                        id="jobreferrer"
                        placeholder="e.g., campaign_123, google_ads_q1"
                        value={formData.jobreferrer}
                        onChange={(e) => setFormData({ ...formData, jobreferrer: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tier">Sponsorship Tier *</Label>
                      <Select
                        value={formData.tier}
                        onValueChange={(value: SponsorshipTier) => 
                          setFormData({ ...formData, tier: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-amber-500" />
                              Premium
                            </div>
                          </SelectItem>
                          <SelectItem value="standard">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-blue-500" />
                              Standard
                            </div>
                          </SelectItem>
                          <SelectItem value="organic">
                            <div className="flex items-center gap-2">
                              <Leaf className="w-4 h-4 text-green-500" />
                              Organic
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="label">Label (optional)</Label>
                      <Input
                        id="label"
                        placeholder="e.g., Google Ads Q1 Campaign"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Add notes about this campaign..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingMapping ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : !mappings?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No campaign mappings configured yet.</p>
            <p className="text-sm">Add mappings to link jobreferrer values to sponsorship tiers.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Referrer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell className="font-mono text-sm">
                    {mapping.jobreferrer}
                  </TableCell>
                  <TableCell>
                    <TierBadge tier={mapping.tier} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mapping.label || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(mapping.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(mapping)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(mapping.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CampaignMappingManager;
