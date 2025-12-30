import { useState, useEffect, useRef } from 'react';
import { lookupZipCode } from '@/utils/zipCodeLookup';

interface UseZipCodeLookupReturn {
  city: string | null;
  state: string | null;
  isLoading: boolean;
  error: string | null;
}

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 500;

// Valid ZIP code pattern (exactly 5 digits)
const VALID_ZIP_PATTERN = /^\d{5}$/;

export const useZipCodeLookup = (zipCode: string | null | undefined): UseZipCodeLookupReturn => {
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track in-flight requests to prevent duplicates
  const lastLookedUpRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const cleanZip = zipCode?.trim() || '';

    // Clear state if no zip code
    if (!cleanZip) {
      setCity(null);
      setState(null);
      setError(null);
      lastLookedUpRef.current = null;
      return;
    }

    // Only lookup valid 5-digit ZIP codes
    if (!VALID_ZIP_PATTERN.test(cleanZip)) {
      // Don't set error for incomplete ZIPs (user still typing)
      return;
    }

    // Skip if we already looked up this ZIP
    if (lastLookedUpRef.current === cleanZip) {
      return;
    }

    // Debounce the lookup
    debounceTimerRef.current = setTimeout(async () => {
      // Double-check we haven't already looked this up
      if (lastLookedUpRef.current === cleanZip) {
        return;
      }

      lastLookedUpRef.current = cleanZip;
      setIsLoading(true);
      setError(null);

      try {
        const result = await lookupZipCode(cleanZip);
        if (result) {
          setCity(result.city);
          setState(result.stateAbbr);
        } else {
          setCity(null);
          setState(null);
          // Don't set error for 404s, just silently handle invalid zip codes
        }
      } catch (err) {
        setCity(null);
        setState(null);
        setError('Failed to lookup zip code');
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or when zipCode changes
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [zipCode]);

  return { city, state, isLoading, error };
};
