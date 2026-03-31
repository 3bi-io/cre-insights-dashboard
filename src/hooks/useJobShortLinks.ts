import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ShortLinkOptions {
  jobListingId: string;
  organizationId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface ShortLink {
  id: string;
  short_code: string;
  job_listing_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  click_count: number;
}

export const useJobShortLinks = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const generateShortCode = (): string => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createShortLink = async (options: ShortLinkOptions): Promise<ShortLink | null> => {
    setIsCreating(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Generate a unique short code with retry logic
      let shortCode = generateShortCode();
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const { data, error } = await supabase
          .from('job_short_links')
          .insert({
            short_code: shortCode,
            job_listing_id: options.jobListingId,
            organization_id: options.organizationId || null,
            utm_source: options.utmSource || null,
            utm_medium: options.utmMedium || null,
            utm_campaign: options.utmCampaign || null,
            created_by: user?.user?.id || null,
          })
          .select()
          .single();

        if (!error) {
          return data as ShortLink;
        }

        if (error.code === '23505') {
          // Unique violation - try again with new code
          shortCode = generateShortCode();
          attempts++;
        } else {
          throw error;
        }
      }

      throw new Error('Could not generate unique short code');
    } catch (error: any) {
      logger.error('Error creating short link', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create short link',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const getShortLinksForJob = async (jobListingId: string): Promise<ShortLink[]> => {
    const { data, error } = await supabase
      .from('job_short_links')
      .select('*')
      .eq('job_listing_id', jobListingId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching short links', error);
      return [];
    }

    return data as ShortLink[];
  };

  const buildApplyUrl = (jobId: string, options?: { 
    utmSource?: string; 
    utmMedium?: string; 
    utmCampaign?: string;
    useShortLink?: boolean;
    shortCode?: string;
  }): string => {
    const baseUrl = window.location.origin;

    // If using short link
    if (options?.useShortLink && options?.shortCode) {
      return `${baseUrl}/j/${options.shortCode}`;
    }

    // Standard apply URL with params
    const params = new URLSearchParams();
    params.set('job_id', jobId);
    
    if (options?.utmSource) params.set('utm_source', options.utmSource);
    if (options?.utmMedium) params.set('utm_medium', options.utmMedium);
    if (options?.utmCampaign) params.set('utm_campaign', options.utmCampaign);

    return `${baseUrl}/apply?${params.toString()}`;
  };

  const buildXApplyUrl = (jobId: string, utmCampaign?: string): string => {
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/x/apply/${jobId}`;
    if (utmCampaign) {
      url += `?utm_campaign=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  };

  const buildFacebookApplyUrl = (jobId: string, utmCampaign?: string): string => {
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/fb/apply/${jobId}`;
    if (utmCampaign) {
      url += `?utm_campaign=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  };

  const buildTikTokApplyUrl = (jobId: string, utmCampaign?: string): string => {
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/tt/apply/${jobId}`;
    if (utmCampaign) {
      url += `?utm_campaign=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  };

  const buildLinkedInApplyUrl = (jobId: string, utmCampaign?: string): string => {
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/in/apply/${jobId}`;
    if (utmCampaign) {
      url += `?utm_campaign=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  };

  /**
   * Build a platform-agnostic social apply URL
   * Uses /s/:platform/apply/:jobId pattern for any supported platform
   */
  const buildSocialApplyUrl = (
    jobId: string, 
    platform: string, 
    utmCampaign?: string
  ): string => {
    const baseUrl = window.location.origin;
    const normalizedPlatform = platform.toLowerCase().trim();
    let url = `${baseUrl}/s/${normalizedPlatform}/apply/${jobId}`;
    if (utmCampaign) {
      url += `?utm_campaign=${encodeURIComponent(utmCampaign)}`;
    }
    return url;
  };

  return {
    createShortLink,
    getShortLinksForJob,
    buildApplyUrl,
    buildXApplyUrl,
    buildFacebookApplyUrl,
    buildTikTokApplyUrl,
    buildLinkedInApplyUrl,
    buildSocialApplyUrl,
    isCreating,
  };
};
