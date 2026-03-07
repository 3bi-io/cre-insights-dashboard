/**
 * Reusable active filter chips with clear buttons
 * Used by JobsPage and other pages with active filters
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

export interface FilterChip {
  label: string;
  value: string;
  onClear: () => void;
  emoji?: string;
}

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  onClearAll: () => void;
}

export const ActiveFilterChips = ({ chips, onClearAll }: ActiveFilterChipsProps) => {
  const activeChips = chips.filter((c) => c.value);

  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {activeChips.map((chip) => (
        <Badge
          key={chip.label}
          variant="secondary"
          className="pl-3 pr-1.5 py-1.5 text-sm flex items-center gap-1.5"
        >
          {chip.emoji && `${chip.emoji} `}
          {chip.label}
          <button
            onClick={chip.onClear}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
            aria-label={`Clear ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 px-2"
      >
        Clear all
      </button>
    </div>
  );
};
