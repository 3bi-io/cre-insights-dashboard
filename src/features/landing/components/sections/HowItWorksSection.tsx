/**
 * How It Works Section
 * Visual flow with animated connector lines and timing badges
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { howItWorksContent, HowItWorksStep } from '../../content/howitworks.content';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const StepCard: React.FC<{ step: HowItWorksStep; index: number; isLast: boolean }> = ({
  step,
  index,
  isLast,
}) => {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className="relative flex flex-col items-center"
    >
      {/* Step number badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
          {index + 1}
        </span>
      </div>

      {/* Card */}
      <div className="relative bg-card border rounded-2xl p-6 pt-8 text-center w-full h-full shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 group">
        {/* Subtle hover gradient */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="relative z-10">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Icon className="h-7 w-7 text-primary" />
            </div>
          </div>

          <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{step.description}</p>

          {step.highlight && (
            <Badge
              variant="secondary"
              className="text-xs bg-primary/10 text-primary border-primary/20 font-semibold"
            >
              {step.highlight}
            </Badge>
          )}
        </div>
      </div>

      {/* Arrow connector (hidden on mobile, shown on desktop) */}
      {!isLast && (
        <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.12 + 0.3 }}
          >
            <ArrowRight className="h-5 w-5 text-primary/40" />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const HowItWorksSection: React.FC = () => {
  return (
    <SectionWrapper id="how-it-works" variant="muted" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-2xl md:text-3xl font-playfair font-bold px-5 py-1.5">
          {howItWorksContent.badge}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-4">
          {howItWorksContent.title}
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {howItWorksContent.description}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
        {howItWorksContent.steps.map((step, index) => (
          <StepCard
            key={index}
            step={step}
            index={index}
            isLast={index === howItWorksContent.steps.length - 1}
          />
        ))}
      </div>
    </SectionWrapper>
  );
};

export default HowItWorksSection;
