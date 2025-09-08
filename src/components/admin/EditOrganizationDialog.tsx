import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { useSuperAdminOrganizations } from '@/hooks/useSuperAdminOrganizations';

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  settings?: any;
}

interface EditOrganizationDialogProps {
  organization: Organization;
  trigger?: React.ReactNode;
}

export const EditOrganizationDialog = ({ organization, trigger }: EditOrganizationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    slug: organization.slug,
    subscription_status: organization.subscription_status,
  });

  const { updateOrganization, isUpdating } = useSuperAdminOrganizations();

  useEffect(() => {
    if (open) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
        subscription_status: organization.subscription_status,
      });
    }
  }, [open, organization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      return;
    }

    const updates: any = {};
    
    if (formData.name !== organization.name) {
      updates.name = formData.name.trim();
    }
    
    if (formData.slug !== organization.slug) {
      updates.slug = formData.slug.trim().toLowerCase().replace(/\s+/g, '-');
    }
    
    if (formData.subscription_status !== organization.subscription_status) {
      updates.subscription_status = formData.subscription_status;
    }

    if (Object.keys(updates).length > 0) {
      updateOrganization({
        id: organization.id,
        ...updates,
      });
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            <Label htmlFor="status">Subscription Status</Label>
            <Select
              value={formData.subscription_status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, subscription_status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !formData.name.trim() || !formData.slug.trim()}>
              {isUpdating ? 'Updating...' : 'Update Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};