import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface SelectionButtonProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  isSelected: boolean;
  onSelect: (value: string) => void;
  className?: string;
  name?: string;
}

export const SelectionButton = ({
  value,
  label,
  description,
  icon,
  isSelected,
  onSelect,
  className,
  name,
}: SelectionButtonProps) => {
  const buttonId = name ? `${name}-${value}` : undefined;
  
  return (
    <button
      type="button"
      id={buttonId}
      name={name}
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(value)}
      className={cn(
        "relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200 touch-manipulation",
        "hover:border-primary/50 hover:bg-accent/50 active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-background",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            "flex-shrink-0 p-2 rounded-lg",
            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-base",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {label}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
        <div className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
          isSelected 
            ? "border-primary bg-primary text-primary-foreground" 
            : "border-muted-foreground/30"
        )}>
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </div>
      </div>
    </button>
  );
};

interface SelectionButtonGroupProps {
  options: Array<{
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
  value: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
  className?: string;
  name?: string;
  label?: string;
}

export const SelectionButtonGroup = ({
  options,
  value,
  onChange,
  columns = 1,
  className,
  name,
  label,
}: SelectionButtonGroupProps) => {
  const generatedId = useId();
  const groupName = name || `selection-${generatedId}`;
  
  return (
    <div 
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid gap-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
        className
      )}
    >
      {options.map((option) => (
        <SelectionButton
          key={option.value}
          {...option}
          name={groupName}
          isSelected={value === option.value}
          onSelect={onChange}
        />
      ))}
    </div>
  );
};
