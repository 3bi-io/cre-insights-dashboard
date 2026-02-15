/**
 * Call-to-Action Section Component
 * Before/After comparison + conversion-focused CTA
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, X } from 'lucide-react';
import { SectionWrapper } from '../shared/SectionWrapper';
import { CTABlock } from '../shared/CTABlock';
import { ctaContent } from '../../content/cta.content';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const comparisonRows = [
  { feature: 'Candidate response time', before: 'Days to weeks', after: 'Under 3 minutes' },
  { feature: 'After-hours coverage', before: 'None', after: '24/7 AI voice agents' },
  { feature: 'Application screening', before: 'Manual review', after: 'Instant AI qualification' },
  { feature: 'ATS integration', before: 'Copy-paste data', after: 'Auto-sync to Tenstreet' },
  { feature: 'Candidate experience', before: 'Black hole', after: 'Immediate callback' },
  { feature: 'Cost per hire', before: '$4,700 avg', after: 'Up to 80% less' },
];

const CTASection = () => {
  const { data: companyCount = 50 } = useQuery({
    queryKey: ['public-company-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('public_client_info')
        .select('id', { count: 'exact', head: true });
      return count || 50;
    },
    staleTime: 1000 * 60 * 5,
  });

  return (
    <SectionWrapper variant="gradient" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge className="mb-6 text-sm px-4 py-2">
            <Zap className="h-4 w-4 mr-2" />
            {ctaContent.badge}
          </Badge>

          <h2 className="text-4xl md:text-5xl font-playfair font-bold mb-4">
            {ctaContent.title}
          </h2>

          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            {ctaContent.description}
          </p>
        </motion.div>

        {/* Before/After Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-12 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        >
          <div className="grid grid-cols-3 bg-muted/50">
            <div className="p-4 text-sm font-semibold text-muted-foreground text-left">Feature</div>
            <div className="p-4 text-sm font-semibold text-destructive text-center">Without ATS.me</div>
            <div className="p-4 text-sm font-semibold text-primary text-center">With ATS.me</div>
          </div>
          {comparisonRows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 border-t border-border/50 hover:bg-muted/20 transition-colors"
            >
              <div className="p-4 text-sm font-medium text-foreground text-left">{row.feature}</div>
              <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                <X className="h-4 w-4 text-destructive/60 shrink-0" />
                <span className="hidden sm:inline">{row.before}</span>
              </div>
              <div className="p-4 text-sm text-foreground font-medium text-center flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-success shrink-0" />
                <span className="hidden sm:inline">{row.after}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <CTABlock
            primaryText={ctaContent.cta.primary}
            primaryPath={ctaContent.cta.primaryPath || '/founders-pass'}
            secondaryText={ctaContent.cta.secondary}
            secondaryPath={ctaContent.cta.secondaryPath || '/contact?subject=founders-pass'}
          />
        </motion.div>

        {/* Social proof urgency */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Join {companyCount}+ companies already hiring smarter · {ctaContent.footer}
        </motion.p>
      </div>
    </SectionWrapper>
  );
};

export default CTASection;
