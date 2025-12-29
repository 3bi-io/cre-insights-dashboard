import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import type { CredentialFieldSchema } from '@/services/atsConnectionsService';

interface DynamicCredentialsFormProps {
  schema: Record<string, CredentialFieldSchema>;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
}

export const DynamicCredentialsForm: React.FC<DynamicCredentialsFormProps> = ({
  schema,
  values,
  onChange,
  disabled = false,
}) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFieldChange = (key: string, value: string) => {
    onChange({
      ...values,
      [key]: value,
    });
  };

  const sortedFields = Object.entries(schema).sort(([, a], [, b]) => {
    // Sort required fields first
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
    return 0;
  });

  if (sortedFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No credentials required for this ATS system.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sortedFields.map(([key, field]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={`credential-${key}`}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {field.type === 'select' && field.options ? (
            <Select
              value={values[key] || ''}
              onValueChange={(value) => handleFieldChange(key, value)}
              disabled={disabled}
            >
              <SelectTrigger id={`credential-${key}`}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : field.type === 'password' ? (
            <div className="relative">
              <Input
                id={`credential-${key}`}
                type={visiblePasswords[key] ? 'text' : 'password'}
                value={values[key] || ''}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                disabled={disabled}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility(key)}
                disabled={disabled}
              >
                {visiblePasswords[key] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          ) : (
            <Input
              id={`credential-${key}`}
              type="text"
              value={values[key] || ''}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              disabled={disabled}
            />
          )}
          
          {field.description && (
            <p className="text-xs text-muted-foreground">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};
