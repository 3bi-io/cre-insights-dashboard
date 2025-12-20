/**
 * Auth Form Fields
 * Reusable form input components with proper touch targets and accessibility
 */

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

export function EmailField({
  value,
  onChange,
  disabled,
  placeholder = "Enter your email",
  autoComplete = "email",
}: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium">
        Email
      </Label>
      <Input
        id="email"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 sm:h-10 touch-manipulation"
      />
    </div>
  );
}

interface PasswordFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
}

export function PasswordField({
  id = "password",
  label = "Password",
  value,
  onChange,
  showPassword,
  onToggleShow,
  disabled,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  showStrength = false,
}: PasswordFieldProps) {
  const getStrengthLabel = () => {
    if (value.length < 6) return 'Weak';
    if (value.length < 10) return 'Medium';
    return 'Strong';
  };

  const strengthPercentage = Math.min(100, (value.length / 12) * 100);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="h-11 sm:h-10 pr-12 touch-manipulation"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "absolute right-0 top-0 h-full px-3",
            "hover:bg-transparent",
            "min-w-[44px] touch-manipulation"
          )}
          onClick={onToggleShow}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {showStrength && value.length > 0 && (
        <div className="space-y-1">
          <Progress value={strengthPercentage} className="h-1" />
          <p className="text-xs text-muted-foreground">
            {getStrengthLabel()}
          </p>
        </div>
      )}
    </div>
  );
}

interface RememberMeFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function RememberMeField({ checked, onCheckedChange }: RememberMeFieldProps) {
  return (
    <div className="flex items-center space-x-3 min-h-[44px] touch-manipulation">
      <Checkbox
        id="rememberMe"
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        className="h-5 w-5"
      />
      <Label
        htmlFor="rememberMe"
        className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
      >
        Remember me
      </Label>
    </div>
  );
}

interface ConfirmPasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ConfirmPasswordField({
  value,
  onChange,
  showPassword,
  disabled,
  placeholder = "Confirm new password",
}: ConfirmPasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="confirmPassword" className="text-sm font-medium">
        Confirm Password
      </Label>
      <Input
        id="confirmPassword"
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="new-password"
        className="h-11 sm:h-10 touch-manipulation"
      />
    </div>
  );
}
