/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcuts for improved UX
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow specific shortcuts even in inputs (like Escape)
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
};

/**
 * Common keyboard shortcuts for applications page
 */
export const useApplicationsKeyboardShortcuts = (handlers: {
  onSearch?: () => void;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onSelectAll?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      description: 'Focus search',
      handler: () => handlers.onSearch?.(),
    },
    {
      key: 'Escape',
      description: 'Clear filters',
      handler: () => handlers.onClearFilters?.(),
    },
    {
      key: 'r',
      ctrl: true,
      description: 'Refresh data',
      handler: () => handlers.onRefresh?.(),
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Export data',
      handler: () => handlers.onExport?.(),
    },
    {
      key: 'a',
      ctrl: true,
      description: 'Select all',
      handler: () => handlers.onSelectAll?.(),
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
};
