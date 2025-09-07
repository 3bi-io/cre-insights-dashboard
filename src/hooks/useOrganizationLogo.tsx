import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrganizationLogo = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { organization, refreshUser } = useAuth();
  const { toast } = useToast();

  const uploadLogo = async (file: File) => {
    if (!organization) {
      toast({
        title: "Error",
        description: "No organization found",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.slug}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      const logoUrl = publicUrlData.publicUrl;

      // Update organization in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: logoUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Refresh user data to update organization info
      await refreshUser();

      toast({
        title: "Success",
        description: "Organization logo uploaded successfully",
      });

      return logoUrl;
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteLogo = async () => {
    if (!organization?.logo_url) return false;

    setIsDeleting(true);
    try {
      // Extract file path from URL
      const url = new URL(organization.logo_url);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `${organization.slug}/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('organization-logos')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update organization in database
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      // Refresh user data to update organization info
      await refreshUser();

      toast({
        title: "Logo Removed",
        description: "Organization logo has been removed successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Logo deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    uploadLogo,
    deleteLogo,
    isUploading,
    isDeleting,
    currentLogo: organization?.logo_url,
  };
};