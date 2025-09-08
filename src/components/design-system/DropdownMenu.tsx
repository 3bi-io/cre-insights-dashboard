/**
 * Enhanced Dropdown Menu Component with Complete Type Safety and Fixed Transparency Issues
 */

import React, { forwardRef } from 'react';
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from "@/lib/utils";
import type { DropdownProps, DropdownItem, A11yProps } from '@/types/ui.types';

const dropdownContentVariants = cva(
  [
    // Base styles with proper background and z-index to prevent transparency
    "min-w-[8rem] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg",
    // High z-index to ensure proper layering
    "z-[1000]",
    // Animation classes
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
  ],
  {
    variants: {
      size: {
        sm: "min-w-[6rem] p-1",
        md: "min-w-[8rem] p-1", 
        lg: "min-w-[12rem] p-2",
        xl: "min-w-[16rem] p-2"
      },
      variant: {
        default: "bg-popover border-border",
        ghost: "bg-background/95 backdrop-blur-sm border-border/50",
        bordered: "bg-popover border-2 border-border"
      }
    },
    defaultVariants: {
      size: "md",
      variant: "default"
    }
  }
);

const dropdownItemVariants = cva(
  [
    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm",
    "outline-none transition-colors duration-150",
    "focus:bg-accent focus:text-accent-foreground",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
  ],
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground",
        destructive: "text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
      },
      inset: {
        true: "pl-8",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      inset: false
    }
  }
);

// Root dropdown menu
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// Enhanced dropdown content with proper background and z-index
const DropdownMenuContent = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> &
    VariantProps<typeof dropdownContentVariants>
>(({ className, sideOffset = 4, size, variant, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(dropdownContentVariants({ size, variant }), className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

// Enhanced dropdown item
const DropdownMenuItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> &
    VariantProps<typeof dropdownItemVariants> & {
      /** Item icon */
      icon?: LucideIcon;
      /** Item description */
      description?: string;
      /** Keyboard shortcut */
      shortcut?: string;
    }
>(({ className, variant, inset, icon: Icon, description, shortcut, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(dropdownItemVariants({ variant, inset }), className)}
    {...props}
  >
    {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
    <div className="flex-1">
      <div>{children}</div>
      {description && (
        <div className="text-xs text-muted-foreground">{description}</div>
      )}
    </div>
    {shortcut && (
      <span className="ml-auto text-xs tracking-widest text-muted-foreground">
        {shortcut}
      </span>
    )}
  </DropdownMenuPrimitive.Item>
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

// Checkbox item
const DropdownMenuCheckboxItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      dropdownItemVariants({ inset: true }),
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

// Radio item
const DropdownMenuRadioItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      dropdownItemVariants({ inset: true }),
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

// Label
const DropdownMenuLabel = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

// Separator
const DropdownMenuSeparator = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

// Sub trigger
const DropdownMenuSubTrigger = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
    icon?: LucideIcon;
  }
>(({ className, inset, icon: Icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      dropdownItemVariants({ inset }),
      "data-[state=open]:bg-accent",
      className
    )}
    {...props}
  >
    {Icon && <Icon className="mr-2 h-4 w-4 shrink-0" />}
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

// Sub content
const DropdownMenuSubContent = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> &
    VariantProps<typeof dropdownContentVariants>
>(({ className, size, variant, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(dropdownContentVariants({ size, variant }), className)}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

// Shortcut text
const DropdownMenuShortcut = forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
    {...props}
  />
));
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// High-level dropdown component for easy usage
export interface SimpleDropdownProps extends A11yProps {
  /** Dropdown trigger element */
  trigger: React.ReactNode;
  /** Dropdown items */
  items: DropdownItem[];
  /** Dropdown size */
  size?: VariantProps<typeof dropdownContentVariants>['size'];
  /** Dropdown variant */
  variant?: VariantProps<typeof dropdownContentVariants>['variant'];
  /** Close on item select */
  closeOnSelect?: boolean;
  /** Dropdown placement */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Content alignment */
  align?: 'start' | 'center' | 'end';
  /** Custom className */
  className?: string;
}

export const SimpleDropdown = forwardRef<HTMLDivElement, SimpleDropdownProps>(
  ({ 
    trigger, 
    items, 
    size = 'md', 
    variant = 'default',
    closeOnSelect = true,
    side = 'bottom',
    align = 'start',
    className,
    ...props 
  }, ref) => {
    const renderItem = (item: DropdownItem) => {
      if (item.type === 'separator') {
        return <DropdownMenuSeparator key={item.key} />;
      }
      
      if (item.type === 'header') {
        return (
          <DropdownMenuLabel key={item.key}>
            {item.label}
          </DropdownMenuLabel>
        );
      }
      
      return (
        <DropdownMenuItem
          key={item.key}
          onClick={item.onClick}
          disabled={item.disabled}
          variant={item.destructive ? 'destructive' : 'default'}
          icon={item.icon}
          description={item.description}
          shortcut={item.shortcut}
        >
          {item.label}
        </DropdownMenuItem>
      );
    };
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          ref={ref}
          size={size}
          variant={variant}
          side={side}
          align={align}
          className={className}
          {...props}
        >
          {items.map(renderItem)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

SimpleDropdown.displayName = "SimpleDropdown";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

export { dropdownContentVariants, dropdownItemVariants };