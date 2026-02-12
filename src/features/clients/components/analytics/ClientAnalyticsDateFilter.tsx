import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { DateRange } from '../../types/clientAnalytics.types';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const labels: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All time',
};

export const ClientAnalyticsDateFilter: React.FC<Props> = ({ value, onChange }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm" className="gap-2">
        <Calendar className="h-4 w-4" />
        {labels[value]}
        <ChevronDown className="h-3 w-3" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {(Object.entries(labels) as [DateRange, string][]).map(([key, label]) => (
        <DropdownMenuItem
          key={key}
          onClick={() => onChange(key)}
          className={value === key ? 'bg-accent' : ''}
        >
          {label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);
