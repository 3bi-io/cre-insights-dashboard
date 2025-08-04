
import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [presetValue, setPresetValue] = useState('last_30d');

  const presets = [
    { value: 'last_7d', label: 'Last 7 days', days: 7 },
    { value: 'last_14d', label: 'Last 14 days', days: 14 },
    { value: 'last_30d', label: 'Last 30 days', days: 30 },
    { value: 'last_60d', label: 'Last 60 days', days: 60 },
    { value: 'last_90d', label: 'Last 90 days', days: 90 },
    { value: 'this_month', label: 'This month' },
    { value: 'last_month', label: 'Last month' },
    { value: 'custom', label: 'Custom range' },
  ];

  const handlePresetChange = (preset: string) => {
    setPresetValue(preset);
    const today = new Date();
    
    switch (preset) {
      case 'last_7d':
      case 'last_14d':
      case 'last_30d':
      case 'last_60d':
      case 'last_90d':
        const selectedPreset = presets.find(p => p.value === preset);
        if (selectedPreset?.days) {
          onChange({
            from: subDays(today, selectedPreset.days),
            to: today
          });
        }
        break;
      case 'this_month':
        onChange({
          from: startOfMonth(today),
          to: endOfMonth(today)
        });
        break;
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        onChange({
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        });
        break;
    }
    
    if (preset !== 'custom') {
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!value.from || !value.to) return 'Date Range';
    
    if (presetValue !== 'custom') {
      const preset = presets.find(p => p.value === presetValue);
      return preset?.label || 'Custom range';
    }
    
    return `${format(value.from, 'MMM dd')} - ${format(value.to, 'MMM dd, yyyy')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-10 min-w-[180px] justify-start">
          <Calendar className="w-4 h-4" />
          <span>{formatDateRange()}</span>
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border border-border shadow-md" align="start">
        <div className="p-4 border-b border-border bg-popover">
          <Select value={presetValue} onValueChange={handlePresetChange}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {presets.map((preset) => (
                <SelectItem key={preset.value} value={preset.value} className="hover:bg-accent hover:text-accent-foreground">
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {presetValue === 'custom' && (
          <div className="p-4">
            <CalendarComponent
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onChange({ from: range.from, to: range.to });
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
              className={cn("pointer-events-auto")}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default DateRangePicker;
