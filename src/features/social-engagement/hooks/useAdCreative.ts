import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  AdCreativeConfig, 
  GeneratedAd, 
  GeneratedAdContent,
  AdCreativeRecord,
  GenerateAdCreativeRequest
} from '../types/adCreative.types';

/**
 * Hook for managing ad creative generation and storage
 */
export function useAdCreative(organizationId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreview, setCurrentPreview] = useState<GeneratedAd | null>(null);

  // Fetch saved ad creatives
  const { data: savedCreatives, isLoading: isLoadingCreatives } = useQuery({
    queryKey: ['ad-creatives', organizationId],
    queryFn: async () => {
      let query = supabase
        .from('generated_ad_creatives')
        .select('*')
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AdCreativeRecord[];
    },
    enabled: true,
  });

  // Generate ad creative via edge function
  const generateCreative = useCallback(async (config: AdCreativeConfig): Promise<GeneratedAd | null> => {
    setIsGenerating(true);
    
    try {
      const request: GenerateAdCreativeRequest = {
        jobType: config.jobType,
        benefits: config.benefits,
        companyName: config.companyName,
        location: config.location,
        salaryRange: config.salaryRange,
        customPrompt: config.customPrompt,
        generateImage: config.mediaType === 'ai_image',
        aspectRatio: config.aspectRatio,
      };

      const { data, error } = await supabase.functions.invoke('generate-ad-creative', {
        body: request,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate creative');
      }

      const generatedAd: GeneratedAd = {
        config,
        content: data.content as GeneratedAdContent,
        mediaUrl: data.mediaUrl,
        generatedAt: new Date().toISOString(),
        status: 'draft',
      };

      setCurrentPreview(generatedAd);
      
      toast({
        title: 'Creative generated!',
        description: 'Your ad creative has been generated successfully.',
      });

      return generatedAd;
    } catch (error) {
      console.error('Generate creative error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Failed to generate creative',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  // Save ad creative to database
  const saveCreative = useMutation({
    mutationFn: async (ad: GeneratedAd) => {
      const { data, error } = await supabase
        .from('generated_ad_creatives')
        .insert({
          organization_id: organizationId || null,
          job_type: ad.config.jobType,
          benefits: ad.config.benefits,
          headline: ad.content.headline,
          body: ad.content.body,
          hashtags: ad.content.hashtags,
          media_url: ad.mediaUrl || null,
          media_type: ad.config.mediaType,
          aspect_ratio: ad.config.aspectRatio,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-creatives'] });
      toast({
        title: 'Creative saved!',
        description: 'Your ad creative has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save creative',
        variant: 'destructive',
      });
    },
  });

  // Delete ad creative
  const deleteCreative = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('generated_ad_creatives')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-creatives'] });
      toast({
        title: 'Creative deleted',
        description: 'The ad creative has been removed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete creative',
        variant: 'destructive',
      });
    },
  });

  // Clear current preview
  const clearPreview = useCallback(() => {
    setCurrentPreview(null);
  }, []);

  return {
    // State
    isGenerating,
    currentPreview,
    savedCreatives: savedCreatives || [],
    isLoadingCreatives,
    
    // Actions
    generateCreative,
    saveCreative,
    deleteCreative,
    clearPreview,
    setCurrentPreview,
  };
}
