import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OrganizationSettings } from './OrganizationSettings';
import { OrganizationFeatureManagement } from './OrganizationFeatureManagement';
import { OrganizationFeatureBadges } from './OrganizationFeatureBadges';
import QuickDomainActions from './QuickDomainActions';

interface OrganizationFormData {
  name: string;
  slug: string;
  logo_url?: string;
  domain?: string;
}

const OrganizationManagement = () => {
  const { userRole } = useAuth();
  const { organizations, isLoading, createOrganization, updateOrganization, deleteOrganization } = useOrganizations();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOrg, setEditingOrg] = useState<any>(null);
  const [selectedOrgForSettings, setSelectedOrgForSettings] = useState<any>(null);
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    logo_url: '',
    domain: ''
  });

  // Only admins and super admins can access this
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">You need admin or super admin permissions to manage organizations.</p>
        </CardContent>
      </Card>
    );
  }

  const handleFeatureUpdate = (organizationId: string, settings: any) => {
    updateOrganization({ id: organizationId, settings });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast({
        title: "Error",
        description: "Name and slug are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingOrg) {
        updateOrganization({ id: editingOrg.id, ...formData });
      } else {
        createOrganization(formData);
      }
      
      setFormData({ name: '', slug: '', logo_url: '', domain: '' });
      setShowCreateDialog(false);
      setEditingOrg(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (org: any) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      slug: org.slug,
      logo_url: org.logo_url || '',
      domain: org.domain || ''
    });
    setShowCreateDialog(true);
  };

  const handleDelete = (orgId: string) => {
    if (window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      deleteOrganization(orgId);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', logo_url: '', domain: '' });
    setEditingOrg(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading organizations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Management
              </CardTitle>
              <CardDescription>
                Manage multi-tenant organizations and their settings.
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={(open) => {
              setShowCreateDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Organization
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingOrg ? 'Edit Organization' : 'Create Organization'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingOrg ? 'Update organization settings' : 'Add a new organization to the platform'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Acme Corp"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="e.g., acme-corp"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_url">Logo URL (optional)</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Custom Domain (optional)</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="acme.com"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      {editingOrg ? 'Update' : 'Create'} Organization
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {organizations && organizations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {org.logo_url && (
                            <img src={org.logo_url} alt={org.name} className="w-8 h-8 object-contain rounded" />
                          )}
                          <span className="font-medium">{org.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{org.slug}</code>
                      </TableCell>
                      <TableCell>
                        <QuickDomainActions
                          organization={org}
                          onOpenDomainSettings={() => setSelectedOrgForSettings(org)}
                        />
                      </TableCell>
                      <TableCell>
                        <OrganizationFeatureBadges 
                          features={org.settings?.features || {}} 
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {org.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrgForSettings(org)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <OrganizationFeatureManagement
                            organization={org}
                            onUpdate={handleFeatureUpdate}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(org)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(org.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No organizations</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first organization to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Organization Settings Dialog */}
      {selectedOrgForSettings && (
        <Dialog open={!!selectedOrgForSettings} onOpenChange={() => setSelectedOrgForSettings(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <OrganizationSettings
              organization={selectedOrgForSettings}
              onUpdate={(orgId, updateData) => {
                updateOrganization({ id: orgId, ...updateData });
                setSelectedOrgForSettings(null);
              }}
              canManageFeatures={userRole === 'super_admin'}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OrganizationManagement;