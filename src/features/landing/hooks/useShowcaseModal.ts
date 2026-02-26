/**
 * useShowcaseModal Hook
 * Manages timed trigger + sessionStorage guard for the Industry Showcase Modal.
 * Fires once per session after a configurable delay.
 */

import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'industry_showcase_shown';
const PERSIST_KEY = 'industry_showcase_dismissed';

interface UseShowcaseModalOptions {
  /** Delay in ms before auto-opening (default 8000) */
  delay?: number;
  /** Whether the trigger is enabled at all */
  enabled?: boolean;
}

export function useShowcaseModal({ delay = 8000, enabled = true }: UseShowcaseModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Don't show if user permanently dismissed or already shown this session
    const permanentlyDismissed = localStorage.getItem(PERSIST_KEY) === 'true';
    const shownThisSession = sessionStorage.getItem(SESSION_KEY) === 'true';

    if (permanentlyDismissed || shownThisSession) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, enabled]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dismissPermanently = useCallback(() => {
    localStorage.setItem(PERSIST_KEY, 'true');
    setIsOpen(false);
  }, []);

  return { isOpen, setIsOpen, dismiss, dismissPermanently };
}
