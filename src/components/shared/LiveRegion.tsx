import React, { useEffect, useState, useCallback } from 'react';

interface LiveRegionProps {
  /** Content to announce. Changing this triggers a new announcement. */
  message: string;
  /** 'polite' waits for silence; 'assertive' interrupts immediately */
  politeness?: 'polite' | 'assertive';
  /** Clear the announcement after this many ms (default: 5000) */
  clearAfter?: number;
}

/**
 * An ARIA live region that announces dynamic content changes to screen readers.
 * Wrap status updates, toast-like messages, or list count changes with this component.
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  clearAfter = 5000,
}) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!message) return;
    // Clear first to force re-announcement of same message
    setAnnouncement('');
    const frame = requestAnimationFrame(() => setAnnouncement(message));
    const timer = setTimeout(() => setAnnouncement(''), clearAfter);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [message, clearAfter]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

/**
 * Hook to imperatively announce messages to screen readers.
 * Returns [announce, LiveRegionComponent].
 */
export function useLiveAnnouncer(politeness: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState('');
  const [counter, setCounter] = useState(0);

  const announce = useCallback((msg: string) => {
    setMessage(msg);
    setCounter((c) => c + 1);
  }, []);

  const LiveRegionComponent = useCallback(
    () => <LiveRegion message={message} politeness={politeness} key={counter} />,
    [message, politeness, counter]
  );

  return [announce, LiveRegionComponent] as const;
}

export default LiveRegion;
