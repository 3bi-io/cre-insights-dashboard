import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useSuperAdminOrganizations } from '@/hooks/useSuperAdminOrganizations';
import { IndustryVerticalSelector } from '@/features/organizations/components/IndustryVerticalSelector';
import { IndustryVertical } from '@/types/common.types';

interface CreateOrganizationDialogProps {
  trigger?: React.ReactNode;
}

export const CreateOrganizationDialog = ({ trigger }: CreateOrganizationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    adminEmail: '',
    industryVertical: 'transportation' as IndustryVertical,
  });

  const { createOrganization, isCreating } = useSuperAdminOrganizations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      return;
    }

    createOrganization({
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      adminEmail: formData.adminEmail.trim() || undefined,
      industryVertical: formData.industryVertical,
    });

    setFormData({ name: '', slug: '', adminEmail: '', industryVertical: 'transportation' });
    setOpen(false);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug from name if slug is empty or was auto-generated
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/\s+/g, '-')
        ? name.toLowerCase().replace(/\s+/g, '-')
        : prev.slug
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Organization
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter organization name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              placeholder="organization-slug"
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
              placeholder="admin@organization.com"
            />
            <p className="text-xs text-muted-foreground">
              Optional. If provided, this user will be granted admin access to the organization.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Industry Vertical</Label>
            <p className="text-xs text-muted-foreground">
              Select an industry to automatically configure platforms, features, and AI settings.
            </p>
            <IndustryVerticalSelector
              value={formData.industryVertical}
              onChange={(value) => setFormData(prev => ({ ...prev, industryVertical: value }))}
              compact
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !formData.name.trim() || !formData.slug.trim()}>
              {isCreating ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
