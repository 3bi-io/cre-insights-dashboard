import React, { useRef, useEffect, useCallback } from 'react';

interface FocusTrapProps {
  /** Whether the trap is active */
  active?: boolean;
  /** Content to trap focus within */
  children: React.ReactNode;
  /** Called when user presses Escape */
  onEscape?: () => void;
  /** Restore focus to this element (or the previously focused element) when deactivated */
  restoreFocus?: boolean;
  /** Additional className for the wrapper */
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus within a container. Essential for modal dialogs,
 * drawers, and other overlay components to meet WCAG 2.1 AA.
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  active = true,
  children,
  onEscape,
  restoreFocus = true,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const container = containerRef.current;
    if (container) {
      const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }

    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, restoreFocus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active) return;

      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [active, onEscape]
  );

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};

export default FocusTrap;
