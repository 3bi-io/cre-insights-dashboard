/**
 * Form Persistence Hook
 * Auto-saves form state to localStorage with expiry
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

interface FormPersistenceOptions {
  key: string;
  expiryHours?: number;
  debounceMs?: number;
}

interface StoredData<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

export function useFormPersistence<T extends object>(
  formData: T,
  setFormData: (data: T) => void,
  options: FormPersistenceOptions
) {
  const { key, expiryHours = 24, debounceMs = 1000 } = options;
  const storageKey = `form_draft_${key}`;
  const [isRestored, setIsRestored] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Check if draft exists on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredData<T> = JSON.parse(stored);
        const now = Date.now();
        
        if (now - parsed.timestamp < parsed.expiryMs) {
          setHasDraft(true);
        } else {
          // Draft expired, remove it
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      logger.error('Error checking for draft', error);
    }
  }, [storageKey]);

  // Restore draft from localStorage
  const restoreDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredData<T> = JSON.parse(stored);
        const now = Date.now();
        
        if (now - parsed.timestamp < parsed.expiryMs) {
          setFormData(parsed.data);
          setIsRestored(true);
          setLastSaved(new Date(parsed.timestamp));
          return true;
        } else {
          // Draft expired, remove it
          localStorage.removeItem(storageKey);
          setHasDraft(false);
        }
      }
    } catch (error) {
      logger.error('Error restoring draft', error);
    }
    return false;
  }, [storageKey, setFormData]);

  // Save to localStorage with debounce
  const saveDraft = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const dataToStore: StoredData<T> = {
          data: formData,
          timestamp: Date.now(),
          expiryMs: expiryHours * 60 * 60 * 1000,
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToStore));
        setLastSaved(new Date());
        setHasDraft(true);
      } catch (error) {
        logger.error('Error saving draft', error);
      }
    }, debounceMs);
  }, [formData, storageKey, expiryHours, debounceMs]);

  // Auto-save on form data change (skip initial load)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    saveDraft();

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, saveDraft]);

  // Clear draft (e.g., after successful submission)
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setLastSaved(null);
    } catch (error) {
      logger.error('Error clearing draft', error);
    }
  }, [storageKey]);

  // Discard draft without restoring
  const discardDraft = useCallback(() => {
    clearDraft();
    setHasDraft(false);
  }, [clearDraft]);

  return {
    isRestored,
    hasDraft,
    lastSaved,
    restoreDraft,
    clearDraft,
    discardDraft,
    saveDraft,
  };
}

export default useFormPersistence;
