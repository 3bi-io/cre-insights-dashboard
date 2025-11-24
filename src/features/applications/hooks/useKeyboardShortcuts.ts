import { useEffect, RefObject } from 'react';

export interface KeyboardShortcutHandlers {
  onSearch?: () => void;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  onToggleView?: () => void;
}

export function useKeyboardShortcuts(
  searchInputRef: RefObject<HTMLInputElement>,
  handlers: KeyboardShortcutHandlers
) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // '/' to focus search (unless already typing)
      if (e.key === '/' && !isTyping && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handlers.onSearch?.();
        searchInputRef.current?.focus();
      }

      // 'Escape' to clear filters
      if (e.key === 'Escape' && handlers.onClearFilters) {
        handlers.onClearFilters();
      }

      // 'r' to refresh (Ctrl/Cmd + R for browser refresh)
      if (e.key === 'r' && !isTyping && !e.ctrlKey && !e.metaKey && handlers.onRefresh) {
        e.preventDefault();
        handlers.onRefresh();
      }

      // 'v' to toggle view
      if (e.key === 'v' && !isTyping && !e.ctrlKey && !e.metaKey && handlers.onToggleView) {
        e.preventDefault();
        handlers.onToggleView();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchInputRef, handlers]);
}
