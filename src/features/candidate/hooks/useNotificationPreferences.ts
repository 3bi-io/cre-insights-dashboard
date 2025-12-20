import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NotificationPreferences {
  emailApplicationUpdates: boolean;
  emailNewJobs: boolean;
  emailMessages: boolean;
  emailMarketing: boolean;
  pushApplicationUpdates: boolean;
  pushNewJobs: boolean;
  pushMessages: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailApplicationUpdates: true,
  emailNewJobs: true,
  emailMessages: true,
  emailMarketing: false,
  pushApplicationUpdates: true,
  pushNewJobs: false,
  pushMessages: true,
};

export const useNotificationPreferences = () => {
  const { user, candidateProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Fetch preferences from candidate profile
  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // For now, we store in localStorage until DB column is added
      const stored = localStorage.getItem(`notification-prefs-${user.id}`);
      if (stored) {
        try {
          return JSON.parse(stored) as NotificationPreferences;
        } catch {
          return defaultPreferences;
        }
      }
      return defaultPreferences;
    },
    enabled: !!user?.id,
  });

  // Sync local state with saved preferences
  useEffect(() => {
    if (savedPreferences) {
      setLocalPreferences(savedPreferences);
    }
  }, [savedPreferences]);

  // Save preferences mutation
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Store in localStorage for now
      localStorage.setItem(`notification-prefs-${user.id}`, JSON.stringify(preferences));
      
      return preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Settings saved',
        description: 'Your notification preferences have been updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error saving preferences',
        description: 'Please try again later',
        variant: 'destructive',
      });
    },
  });

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
  };

  const enableAll = () => {
    setLocalPreferences({
      emailApplicationUpdates: true,
      emailNewJobs: true,
      emailMessages: true,
      emailMarketing: true,
      pushApplicationUpdates: true,
      pushNewJobs: true,
      pushMessages: true,
    });
  };

  const disableAll = () => {
    setLocalPreferences({
      emailApplicationUpdates: false,
      emailNewJobs: false,
      emailMessages: false,
      emailMarketing: false,
      pushApplicationUpdates: false,
      pushNewJobs: false,
      pushMessages: false,
    });
  };

  const save = () => {
    savePreferences(localPreferences);
  };

  const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(savedPreferences);

  return {
    preferences: localPreferences,
    isLoading,
    isSaving,
    hasChanges,
    updatePreference,
    enableAll,
    disableAll,
    save,
  };
};
