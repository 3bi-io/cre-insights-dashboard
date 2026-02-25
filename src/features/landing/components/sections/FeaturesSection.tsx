/**
 * Features Section Component
 * Tabbed view: For Candidates / For Employers with enhanced cards
 */

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '../shared/SectionWrapper';
import { SectionHeader } from '../shared/SectionHeader';
import { IconFeatureCard } from '../shared/IconFeatureCard';
import { featuresContent } from '../../content/features.content';
import { trustContent } from '../../content/trust.content';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'all', label: 'All Features' },
  { id: 'candidates', label: 'For Candidates' },
  { id: 'employers', label: 'For Employers' },
];

// Map features to audience (by index - first 3 candidate-facing, rest employer-facing)
const getFilteredFeatures = (tab: string, features: typeof featuresContent.features) => {
  if (tab === 'all') return features;
  if (tab === 'candidates') return features.slice(0, 3);
  return features.slice(3);
};

const FeaturesSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const filteredFeatures = getFilteredFeatures(activeTab, featuresContent.features);

  return (
    <section id="features">
      <SectionWrapper className="py-16 md:py-24">
        <SectionHeader
          title={featuresContent.title}
          description={featuresContent.description}
          badge={
            <Badge className="bg-primary/10 text-primary border-primary/20 text-3xl md:text-4xl font-playfair font-bold px-6 py-2">
              {trustContent.badge}
            </Badge>
          }
        />

        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-muted/50 rounded-xl p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <IconFeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Learn more link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Explore all features
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </SectionWrapper>
    </section>
  );
};

export default FeaturesSection;
