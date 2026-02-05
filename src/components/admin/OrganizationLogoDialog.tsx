 import React, { useState } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Image as ImageIcon } from 'lucide-react';
 import { OrganizationLogoUpload } from '@/components/organizations/OrganizationLogoUpload';
 import { useQueryClient } from '@tanstack/react-query';
 
 interface OrganizationLogoDialogProps {
   organization: {
     id: string;
     name: string;
     slug: string;
     logo_url?: string | null;
   };
   trigger?: React.ReactNode;
 }
 
 export const OrganizationLogoDialog: React.FC<OrganizationLogoDialogProps> = ({
   organization,
   trigger,
 }) => {
   const [open, setOpen] = useState(false);
   const [currentLogoUrl, setCurrentLogoUrl] = useState(organization.logo_url);
   const queryClient = useQueryClient();
 
   const handleLogoUpdate = (logoUrl: string | null) => {
     setCurrentLogoUrl(logoUrl);
     // Invalidate the organizations query to refresh the list
     queryClient.invalidateQueries({ queryKey: ['admin-organizations-data'] });
   };
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         {trigger || (
           <Button size="sm" variant="outline">
             <ImageIcon className="w-4 h-4 mr-1" />
             Logo
           </Button>
         )}
       </DialogTrigger>
       <DialogContent className="sm:max-w-lg">
         <DialogHeader>
           <DialogTitle>Manage Logo - {organization.name}</DialogTitle>
         </DialogHeader>
         <div className="mt-4">
           <OrganizationLogoUpload
             organizationId={organization.id}
             organizationSlug={organization.slug}
             currentLogoUrl={currentLogoUrl}
             onLogoUpdate={handleLogoUpdate}
           />
         </div>
       </DialogContent>
     </Dialog>
   );
 };