import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_FIELD_TYPES } from '@/types/tenstreet';

interface TenstreetFieldSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TenstreetFieldSelect: React.FC<TenstreetFieldSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select field" 
}) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">-- None --</SelectItem>
        {AVAILABLE_FIELD_TYPES.map(field => (
          <SelectItem key={field} value={field}>{field}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
