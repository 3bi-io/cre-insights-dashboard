/**
 * IndustryShowcaseModal
 * Interactive modal showcasing Apply AI's multi-industry capabilities.
 * Driven by industryTemplates config. Desktop = Dialog, Mobile = Drawer.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, HeartPulse, Shield, Wrench, Building, ArrowRight, Calendar } from 'lucide-react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  INDUSTRY_VERTICAL_OPTIONS,
  INDUSTRY_TEMPLATES,
} from '@/features/organizations/config/industryTemplates.config';
import type { IndustryVertical } from '@/features/organizations/types/industryTemplates.types';
import { useShowcaseModal } from '../hooks/useShowcaseModal';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Truck,
  HeartPulse,
  Shield,
  Wrench,
  Building,
};

interface IndustryShowcaseModalProps {
  /** Override open state externally (optional) */
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const IndustryShowcaseModal: React.FC<IndustryShowcaseModalProps> = ({
  externalOpen,
  onExternalOpenChange,
}) => {
  const { isOpen, setIsOpen, dismissPermanently } = useShowcaseModal({ delay: 8000 });
  const [selected, setSelected] = useState<IndustryVertical>('transportation');

  const open = externalOpen ?? isOpen;
  const handleOpenChange = (val: boolean) => {
    onExternalOpenChange?.(val);
    setIsOpen(val);
  };

  const template = INDUSTRY_TEMPLATES[selected];
  const option = INDUSTRY_VERTICAL_OPTIONS.find((o) => o.value === selected);

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange}>
      <ResponsiveModalContent className="sm:max-w-lg" maxHeight="80vh">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="font-playfair text-2xl">
            Built for Your Industry
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            One platform, purpose-built for how you hire.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {/* Industry Cards Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 py-4">
          {INDUSTRY_VERTICAL_OPTIONS.map((ind) => {
            const Icon = ICON_MAP[ind.icon] || Building;
            const isActive = selected === ind.value;
            return (
              <button
                key={ind.value}
                onClick={() => setSelected(ind.value)}
                aria-pressed={isActive}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all duration-200',
                  'hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-card'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium leading-tight',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {ind.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-border bg-muted/30 p-4 space-y-3"
          >
            <h3 className="font-semibold text-foreground">{template.displayName}</h3>
            <p className="text-sm text-muted-foreground">{template.description}</p>

            {/* Feature badges */}
            {option && (
              <div className="flex flex-wrap gap-1.5">
                {option.features.map((feat) => (
                  <Badge key={feat} variant="secondary" className="text-xs">
                    {feat}
                  </Badge>
                ))}
              </div>
            )}

            {/* Terminology tags */}
            {template.aiPromptHints.terminology.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.aiPromptHints.terminology.slice(0, 6).map((term) => (
                  <span
                    key={term}
                    className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                  >
                    {term}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <ResponsiveModalFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button variant="default" className="w-full sm:w-auto" asChild>
            <a href="/features">
              Explore {template.displayName}
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <a href="/contact">
              <Calendar className="mr-1 h-4 w-4" />
              Book a Demo
            </a>
          </Button>
        </ResponsiveModalFooter>

        {/* Don't show again */}
        <div className="flex justify-center pt-2 pb-1">
          <button
            onClick={dismissPermanently}
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
          >
            Don't show this again
          </button>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default IndustryShowcaseModal;
