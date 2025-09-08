import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { useSuperAdminOrganizations } from '@/hooks/useSuperAdminOrganizations';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface DeleteOrganizationDialogProps {
  organization: Organization;
  trigger?: React.ReactNode;
}

export const DeleteOrganizationDialog = ({ organization, trigger }: DeleteOrganizationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  
  const { deleteOrganization, isDeleting } = useSuperAdminOrganizations();

  const expectedText = `DELETE ${organization.slug}`;
  const isConfirmationValid = confirmationText === expectedText;

  const handleDelete = () => {
    if (isConfirmationValid) {
      deleteOrganization(organization.id);
      setOpen(false);
      setConfirmationText('');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmationText('');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Are you sure you want to delete <strong>{organization.name}</strong>? 
                This action cannot be undone.
              </p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm font-medium text-destructive mb-2">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-destructive space-y-1 ml-4">
                  <li>• All organization data and settings</li>
                  <li>• All job listings and applications</li>
                  <li>• All user profiles and roles</li>
                  <li>• All associated integrations and features</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">{expectedText}</code> to confirm:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={expectedText}
                  className="font-mono"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Organization'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};