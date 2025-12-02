import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatBotPreferences {
  position: { x: number; y: number };
  isPinned: boolean;
  isMinimized: boolean;
}

const DEFAULT_PREFERENCES: ChatBotPreferences = {
  position: { x: 24, y: 24 },
  isPinned: false,
  isMinimized: false,
};

export const useChatBotPreferences = () => {
  const [preferences, setPreferences] = useState<ChatBotPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('user_preferences')
        .select('chatbot_preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading chatbot preferences:', error);
        setIsLoading(false);
        return;
      }

      if (data?.chatbot_preferences) {
        const savedPrefs = data.chatbot_preferences as unknown as ChatBotPreferences;
        setPreferences({
          position: savedPrefs.position || DEFAULT_PREFERENCES.position,
          isPinned: savedPrefs.isPinned ?? DEFAULT_PREFERENCES.isPinned,
          isMinimized: savedPrefs.isMinimized ?? DEFAULT_PREFERENCES.isMinimized,
        });
      }
    } catch (error) {
      console.error('Error loading chatbot preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<ChatBotPreferences>) => {
    if (!userId) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          chatbot_preferences: updatedPreferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving chatbot preferences:', error);
      }
    } catch (error) {
      console.error('Error saving chatbot preferences:', error);
    }
  };

  return {
    preferences,
    isLoading,
    savePreferences,
  };
};
