/**
 * Trust Section Component
 * Client testimonials + star ratings + trust stats
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { CountUpStatCard } from '../shared/CountUpStatCard';
import { trustContent } from '../../content/trust.content';
import { motion } from 'framer-motion';

const TrustSection = () => {

  return (
    <SectionWrapper variant="muted" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12">

        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-2xl md:text-3xl font-playfair font-bold px-5 py-1.5">
          Merit and Skills Based
        </Badge>
        <h2 className="text-2xl md:text-3xl font-playfair font-bold text-foreground mb-4">
          {trustContent.title}
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          {trustContent.description}
        </p>

      </motion.div>

      {/* Trust Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {trustContent.stats.map((stat, index) =>
        <CountUpStatCard
          key={index}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
          description={stat.description}
          delay={index * 100} />

        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-10 text-center">

        <p className="text-sm text-muted-foreground">
          {trustContent.footer}
        </p>
      </motion.div>
    </SectionWrapper>);

};

export default TrustSection;