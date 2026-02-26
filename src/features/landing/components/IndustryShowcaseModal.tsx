/**
 * IndustryShowcaseModal
 * Best-in-class showcase of Apply AI's multi-industry capabilities.
 * Desktop = Dialog, Mobile = Drawer. Staggered animations, rich detail panel.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, HeartPulse, Shield, Wrench, Building,
  ArrowRight, Calendar, CheckCircle2, Sparkles,
} from 'lucide-react';
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
  Truck, HeartPulse, Shield, Wrench, Building,
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

interface IndustryShowcaseModalProps {
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
  const ActiveIcon = ICON_MAP[template.icon] || Building;

  return (
    <ResponsiveModal open={open} onOpenChange={handleOpenChange}>
      <ResponsiveModalContent className="sm:max-w-2xl" maxHeight="85vh">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="font-playfair text-2xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Built for Your Industry
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            One platform, purpose-built for how you hire.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {/* Gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        {/* Industry selector — horizontal scroll mobile, 5-col grid desktop */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex gap-2 overflow-x-auto py-4 sm:grid sm:grid-cols-5 sm:overflow-visible scrollbar-hide"
        >
          {INDUSTRY_VERTICAL_OPTIONS.map((ind) => {
            const Icon = ICON_MAP[ind.icon] || Building;
            const isActive = selected === ind.value;
            return (
              <motion.button
                key={ind.value}
                variants={cardItem}
                onClick={() => setSelected(ind.value)}
                aria-pressed={isActive}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-3.5 text-center transition-all duration-200 min-w-[5.5rem] flex-shrink-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'border-primary/60 bg-primary/10 shadow-md ring-2 ring-primary/20'
                    : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold leading-tight',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {ind.label}
                </span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border border-border bg-muted/30 p-5 space-y-4"
          >
            {/* Header with icon */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <ActiveIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">{template.displayName}</h3>
                {template.valueProposition && (
                  <p className="text-sm text-primary font-medium">{template.valueProposition}</p>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{template.description}</p>

            {/* Two-column: Features + Screening Focus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Features */}
              {option && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What's Included
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {option.features.map((feat) => (
                      <Badge key={feat} variant="secondary" className="text-xs gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                        {feat}
                      </Badge>
                    ))}
                    {template.aiPromptHints.terminology.slice(0, 4).map((term) => (
                      <Badge key={term} variant="outline" className="text-[10px]">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Screening Focus */}
              {template.aiPromptHints.screeningFocus.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    AI Screening Focus
                  </span>
                  <ul className="space-y-1.5">
                    {template.aiPromptHints.screeningFocus.map((item) => (
                      <li key={item} className="flex items-start gap-1.5 text-sm text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <ResponsiveModalFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
            asChild
          >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={dismissPermanently}
            className="text-xs text-muted-foreground sm:ml-auto"
          >
            Don't show again
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};

export default IndustryShowcaseModal;
