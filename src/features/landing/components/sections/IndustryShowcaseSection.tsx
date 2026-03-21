/**
 * Industry Showcase Section
 * Inline section replacing the auto-opening modal.
 * Shows industry vertical selector with details panel.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Truck, HeartPulse, Shield, Wrench, Building,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  INDUSTRY_VERTICAL_OPTIONS,
  INDUSTRY_TEMPLATES,
} from '@/features/organizations/config/industryTemplates.config';
import type { IndustryVertical } from '@/features/organizations/types/industryTemplates.types';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Truck, HeartPulse, Shield, Wrench, Building,
};

const IndustryShowcaseSection: React.FC = () => {
  const [selected, setSelected] = useState<IndustryVertical>('transportation');

  const template = INDUSTRY_TEMPLATES[selected];
  const option = INDUSTRY_VERTICAL_OPTIONS.find((o) => o.value === selected);
  const ActiveIcon = ICON_MAP[template.icon] || Building;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-foreground mb-3">
            Built for Your Industry
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform, purpose-built for how you hire.
          </p>
        </div>

        {/* Industry selector tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {INDUSTRY_VERTICAL_OPTIONS.map((ind) => {
            const Icon = ICON_MAP[ind.icon] || Building;
            const isActive = selected === ind.value;
            return (
              <button
                key={ind.value}
                onClick={() => setSelected(ind.value)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 border',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {ind.label}
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl mx-auto rounded-2xl border border-border bg-card p-6 md:p-10"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{template.displayName}</h3>
                {template.valueProposition && (
                  <p className="text-sm text-primary font-medium">{template.valueProposition}</p>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{template.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {option && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                    What's Included
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {option.features.map((feat) => (
                      <Badge key={feat} variant="secondary" className="text-xs gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                        {feat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {template.aiPromptHints.screeningFocus.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
                    AI Screening Focus
                  </span>
                  <ul className="space-y-2">
                    {template.aiPromptHints.screeningFocus.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/features">
                <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                  Explore {template.displayName}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline">
                  Book a Demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default IndustryShowcaseSection;
