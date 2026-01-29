import { useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

interface EmbedModeOptions {
  onSubmitSuccess?: (applicationId: string, organizationName?: string) => void;
}

interface EmbedModeReturn {
  isEmbedded: boolean;
  hideBranding: boolean;
  notifyParent: (data: { type: string; applicationId?: string; organizationName?: string }) => void;
  sendHeight: () => void;
}

/**
 * Hook for iframe embedding support with postMessage communication
 * Handles parent window communication and auto-resize
 */
export const useEmbedMode = (options: EmbedModeOptions = {}): EmbedModeReturn => {
  const [searchParams] = useSearchParams();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Check if we're in an iframe
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

  // URL param to hide branding
  const hideBranding = searchParams.get('hide_branding') === 'true';

  // Send message to parent window
  const notifyParent = useCallback((data: { type: string; applicationId?: string; organizationName?: string }) => {
    if (isEmbedded) {
      window.parent.postMessage(data, '*');
    }
  }, [isEmbedded]);

  // Send current height to parent for auto-resize
  const sendHeight = useCallback(() => {
    if (isEmbedded) {
      window.parent.postMessage({
        type: 'resize',
        height: document.body.scrollHeight,
      }, '*');
    }
  }, [isEmbedded]);

  // Auto-resize observer
  useEffect(() => {
    if (!isEmbedded) return;

    // Initial height report
    sendHeight();

    // Set up ResizeObserver for dynamic content
    resizeObserverRef.current = new ResizeObserver(() => {
      sendHeight();
    });

    resizeObserverRef.current.observe(document.body);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [isEmbedded, sendHeight]);

  // Notify when leaving the page
  useEffect(() => {
    if (!isEmbedded) return;

    const handleBeforeUnload = () => {
      notifyParent({ type: 'page_unload' });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEmbedded, notifyParent]);

  return {
    isEmbedded,
    hideBranding,
    notifyParent,
    sendHeight,
  };
};
