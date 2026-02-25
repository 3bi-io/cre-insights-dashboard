/**
 * Integrations Section Component
 * Displays available platform integrations with animations and icons
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { integrationsContent } from '../../content/integrations.content';

const IntegrationsSection = () => {
  return (
    <section id="integrations" aria-label="Platform integrations">
      <SectionWrapper>
        <SectionHeader
          title={integrationsContent.title}
          description={integrationsContent.description}
          badge={
            <Badge className="bg-primary/10 text-primary border-primary/20 text-2xl md:text-3xl font-playfair font-bold px-5 py-1.5">
              {integrationsContent.badge}
            </Badge>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {integrationsContent.categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Card className="relative overflow-hidden border-muted hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary/20" />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {Icon && (
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-foreground">
                        {category.title}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {category.integrations.map((integration, idx) => (
                        <li key={idx} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                          {integration}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-4">
            {integrationsContent.footerText}
          </p>
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            {integrationsContent.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </SectionWrapper>
    </section>
  );
};

export default IntegrationsSection;
