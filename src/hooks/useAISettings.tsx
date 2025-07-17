import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AISettings {
  id?: string;
  user_id: string;
  experience_sensitivity: number;
  industry_focus: string;
  bias_reduction_level: number;
  explainability_level: string;
  data_sharing_level: string;
  ai_processing_enabled: boolean;
  sensitive_data_processing: boolean;
  data_retention_days: number;
  audit_enabled: boolean;
}

export const useAISettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // First try to get existing settings
      const { data, error } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings: Omit<AISettings, 'id'> = {
          user_id: user.id,
          experience_sensitivity: 0.5,
          industry_focus: 'general',
          bias_reduction_level: 0.8,
          explainability_level: 'medium',
          data_sharing_level: 'internal',
          ai_processing_enabled: true,
          sensitive_data_processing: false,
          data_retention_days: 365,
          audit_enabled: true,
        };

        const { data: newSettings, error: createError } = await supabase
          .from('ai_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          // If unique constraint violation, try to fetch existing settings again
          if (createError.code === '23505') {
            const { data: existingData, error: fetchError } = await supabase
              .from('ai_settings')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (fetchError) throw fetchError;
            setSettings(existingData);
          } else {
            throw createError;
          }
        } else {
          setSettings(newSettings);
        }
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
      toast.error('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AISettings>) => {
    if (!user || !settings) return;

    try {
      const { data, error } = await supabase
        .from('ai_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setSettings(data);
      toast.success('AI settings updated successfully');
    } catch (error) {
      console.error('Error updating AI settings:', error);
      toast.error('Failed to update AI settings');
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    reload: loadSettings,
  };
};