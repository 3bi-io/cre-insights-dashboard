/**
 * Founders Pass Landing Page
 * Performance-based pricing for early adopters — mobile-first, best-in-class UX
 * Uses platform design system: HeroBackground, SectionWrapper, SectionHeader
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { StructuredData, buildWebSiteSchema } from '@/components/StructuredData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, DollarSign, Headphones, Send, Zap, MessageSquare, ArrowRight } from 'lucide-react';
import { HeroBackground } from '@/components/shared/HeroBackground';
import { SectionWrapper } from '@/features/landing/components/shared/SectionWrapper';
import { SectionHeader } from '@/features/landing/components/shared/SectionHeader';
import { foundersPassContent as c } from '@/features/landing/content/foundersPass.content';
import { FoundersPassVoiceCTA } from '@/features/landing/components/FoundersPassVoiceCTA';
import { containerVariants, itemVariants, fadeInViewProps } from '@/utils/animationVariants';

import heroImage from '@/assets/founders-pass-hero.jpg';
import step1Image from '@/assets/founders-step1-signup.png';
import step2Image from '@/assets/founders-step2-broadcast.png';
import step3Image from '@/assets/founders-step3-metrics.png';

const pricingIcons = [DollarSign, Send, Headphones];
const stepImages = [step1Image, step2Image, step3Image];

const FoundersPassPage = () => {
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen">
      <SEO
        title="Founders Pass — $3/Apply Performance Pricing | Apply AI"
        description="Limited-time Founders Pass: free signup, free onboarding, $1 per apply, $1 ATS delivery, $1 optional Voice Agent. Pay only when it works."
        keywords="founders pass, performance pricing, pay per apply, recruitment platform, ATS, AI voice agent"
        canonical="https://apply.jobs/founders-pass"
        ogImage="/og-founders-pass.png"
      />
      <StructuredData data={buildWebSiteSchema()} />

      {/* ── Hero ── */}
      <HeroBackground
        imageSrc={heroImage}
        imageAlt="Diverse team reviewing applicant data in a modern logistics office"
        overlayVariant="gradient"
        priority
        className="min-h-[85dvh] sm:min-h-[70dvh] flex items-center"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <motion.div
            className="max-w-3xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-5 sm:mb-6 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 text-black bg-white rounded-full">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {c.badge}
              </Badge>
            </motion.div>

            <motion.h1
              className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold mb-3 sm:mb-4 tracking-tight text-foreground"
              variants={itemVariants}
            >
              {c.headline}
            </motion.h1>

            <motion.p
              className="text-xl sm:text-2xl md:text-3xl font-medium text-primary mb-3 sm:mb-4"
              variants={itemVariants}
            >
              {c.tagline}
            </motion.p>

            <motion.p
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mb-4 px-0"
              variants={itemVariants}
            >
              {c.description}
            </motion.p>

            <motion.p
              className="inline-block text-sm font-medium bg-black/40 backdrop-blur-md text-white rounded-full px-4 py-1.5 mb-8"
              variants={itemVariants}
            >
              {c.hero.socialProof}
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start"
              variants={itemVariants}
            >
              <FoundersPassVoiceCTA variant="hero" />
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base sm:text-lg px-6 py-5 sm:py-6 min-h-[48px] border-foreground/20"
              >
                <Link to={c.cta.secondaryPath}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {c.cta.secondary}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </HeroBackground>

      {/* ── Pricing Breakdown ── */}
      <SectionWrapper id="pricing">
        <SectionHeader
          title="Simple, Performance-Based Pricing"
          description="No upfront costs. No subscriptions. Pay only when candidates apply."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {c.pricing.map((tier, i) => {
            const Icon = pricingIcons[i];
            return (
              <motion.div
                key={tier.service}
                {...fadeInViewProps}
                transition={{ ...fadeInViewProps.transition, delay: i * 0.1 }}
              >
                <Card className="h-full border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 mb-4 sm:mb-5">
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                    </div>
                    {tier.badge && (
                      <Badge variant="secondary" className="mb-3 text-xs">
                        {tier.badge}
                      </Badge>
                    )}
                    <div className="text-4xl sm:text-5xl font-bold mb-1 text-foreground">{tier.cost}</div>
                    <div className="text-sm text-muted-foreground mb-3 sm:mb-4">per apply</div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">{tier.service}</h3>
                    <p className="text-muted-foreground text-sm mb-3 sm:mb-4">{tier.description}</p>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed">{tier.note}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          className="text-center mt-8 sm:mt-10 text-base sm:text-lg font-semibold text-primary"
          {...fadeInViewProps}
        >
          {c.comparisonNote}
        </motion.p>
      </SectionWrapper>

      {/* ── What's Included ── */}
      <SectionWrapper variant="muted">
        <SectionHeader title="Everything Included — Zero Cost to Start" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
          {c.included.map((item, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-background/60 sm:bg-background/40 min-h-[48px]"
              {...fadeInViewProps}
              transition={{ ...fadeInViewProps.transition, delay: i * 0.06 }}
            >
              <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground text-sm sm:text-base">{item}</span>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* ── How It Works ── */}
      <SectionWrapper>
        <SectionHeader title="How It Works" />

        <div className="max-w-4xl mx-auto">
          {/* Mobile: vertical timeline | Desktop: horizontal grid */}
          <div className="flex flex-col gap-0 sm:grid sm:grid-cols-3 sm:gap-8">
            {c.steps.map((step, i) => (
              <motion.div
                key={step.step}
                className="relative flex items-start gap-4 sm:flex-col sm:items-center sm:text-center pb-8 sm:pb-0"
                {...fadeInViewProps}
                transition={{ ...fadeInViewProps.transition, delay: i * 0.12 }}
              >
                {/* Timeline connector (mobile only) */}
                {i < c.steps.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-px bg-border sm:hidden" aria-hidden="true" />
                )}

                {/* Step image */}
                <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 sm:mb-5 rounded-xl sm:rounded-2xl overflow-hidden bg-primary/5 p-1.5 sm:p-2 relative z-10">
                  <img
                    src={stepImages[i]}
                    alt={step.title}
                    className="w-full h-full object-contain rounded-lg sm:rounded-xl"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    Step {step.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* ── CTA Footer ── */}
      <SectionWrapper variant="gradient">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          {...fadeInViewProps}
        >
          <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-primary mx-auto mb-4" />

          <Badge variant="outline" className="mb-4 text-xs border-primary/40">
            {c.badge}
          </Badge>

          <p className="text-base sm:text-lg font-medium text-muted-foreground mb-6 sm:mb-8">
            {c.urgency}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <FoundersPassVoiceCTA variant="footer" />
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-muted-foreground hover:text-foreground min-h-[48px]"
            >
              <Link to={c.cta.secondaryPath}>
                {c.cta.secondary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground">
            {c.footer}
          </p>
        </motion.div>
      </SectionWrapper>

      {/* ── Sticky Mobile CTA Bar ── */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 sm:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        initial={{ y: 100 }}
        animate={{ y: showStickyBar ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{c.hero.priceAnchor}</p>
            <p className="text-xs text-muted-foreground truncate">{c.tagline}</p>
          </div>
          <FoundersPassVoiceCTA variant="hero" className="shrink-0 text-sm px-4 py-2.5" />
        </div>
      </motion.div>
    </main>
  );
};

export default FoundersPassPage;
